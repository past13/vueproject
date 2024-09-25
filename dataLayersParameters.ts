import { Geometry, GeometryCollection } from "ol/geom";
import { Feature, Map } from "ol";
import { GeoJSONGeometrie } from "@/models/geometry";
import { click, pointerMove } from "ol/events/condition";
import Select, { SelectEvent } from 'ol/interaction/Select';
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import GeoJSON from 'ol/format/GeoJSON';
import Style from "ol/style/Style";
import Stroke from "ol/style/Stroke";
import Fill from "ol/style/Fill";
import CircleStyle from "ol/style/Circle";
import RenderFeature from "ol/render/Feature";
import { Distinct } from "@/helpers/array";

export interface DataLayerItem {
    id: string;
    geometrie: GeoJSONGeometrie | null;
}

export class DataLayerParameters {
    drawSource: VectorSource<Geometry>;
    drawLayer: VectorLayer<VectorSource<Geometry>>;

    click!: Select;
    pointerMove!: Select;

    public clickedDataLayerItemId: string | null = null;

    constructor(
        readonly map: Map, 
        readonly onClickCallback: (verzoeknummer: string[], pixel: [number, number]) => void,
        readonly onHoverCallback: (verzoeknummer: string, pixel: [number, number]) => void,
        readonly onHoverEndCallback: () => void,
        readonly onMoved: () => void,
        readonly name: string) 
    {
        this.drawSource = new VectorSource();
        this.drawLayer = new VectorLayer({
            source: this.drawSource,
            style: this.getDefaultStyle
        });

        this.map.on("movestart", onMoved);

        this.click = new Select({
            condition: click,
            style: this.getHighlightedStyle,
            layers: [this.drawLayer]
        });
        this.click.on("select", (e) => this.onClick(e, map));
        
        this.pointerMove = new Select({
            condition: pointerMove,
            style: this.getHighlightedStyle,
            layers: [this.drawLayer]
        });
        this.pointerMove.on("select", (e) => this.onPointerMove(e, map))

        this.map.addInteraction(this.click);
        this.map.addInteraction(this.pointerMove);
    }

    get features() {
        return this.drawSource.getFeatures();
    }

    public populate(items: DataLayerItem[]) {
        this.drawSource.clear();
        this.map.removeLayer(this.drawLayer);

        const result = items.map((item) => {
            if (item.geometrie) {
                return this.createFeaturesFromGeometryCollection(item.geometrie, item.id)
            };
        });

        const flattenResult = (result ? result.flat().filter(item => item !== undefined) : []);

        if (flattenResult.length > 0) {
            for (const verzoek of flattenResult) {
                new GeoJSON()
                    .readFeatures(verzoek)
                    .map(x => {
                        return {
                            geometry: x.getGeometry(),
                            id: x.get('id')
                        }
                    })
                    .forEach(x => {
                        if (x.geometry) {
                            this.addGeometryToDrawLayer(x.geometry, x.id);
                        }
                    });
            }
        }

        this.drawLayer.set('name', this.name)
        this.map.addLayer(this.drawLayer);
    }

    public clear(): void {
        this.map.removeLayer(this.drawLayer);
    }

    public hover(dataLayerItemId: string) {
        if (dataLayerItemId !== this.clickedDataLayerItemId) {
            this.highlight(dataLayerItemId, true);
        }
    }

    public removeHover(dataLayerItemId: string) {
        if (dataLayerItemId !== this.clickedDataLayerItemId) {
            this.highlight(dataLayerItemId, false);
        }
    }

    public clicked(dataLayerItemId: string) {
        this.clickedDataLayerItemId = dataLayerItemId;
        this.highlight(dataLayerItemId, true);
    }

    public removeClicked(dataLayerItemId: string) {
        this.clickedDataLayerItemId = null;
        this.highlight(dataLayerItemId, false);
    }

    private highlight(dataLayerItemId: string, highlight: boolean) {
        const features = this.features.filter(feature => feature.get('id') === dataLayerItemId);
        features.forEach(feature => {
            const style = highlight ? this.getHighlightedStyle(feature) : this.getDefaultStyle(feature);
            feature.setStyle(style);
        });      
    }

    private onClick(event: SelectEvent, map: Map) {
        let selectedIdentifiers: string[] = [];
        const pixel = event.mapBrowserEvent.pixel;
        
        map.forEachFeatureAtPixel(pixel, (featureLike) => {
            selectedIdentifiers.push(featureLike.get("id"));
        });

        if (this.clickedDataLayerItemId) {
            this.removeClicked(this.clickedDataLayerItemId);
        }        

        selectedIdentifiers = Distinct(selectedIdentifiers);

        if (selectedIdentifiers.length === 1) {
            this.clickedDataLayerItemId = selectedIdentifiers[0];
        }

        if (selectedIdentifiers.length > 1) {
            this.click.getFeatures().clear();
        }

        this.onClickCallback(selectedIdentifiers, [pixel[0], pixel[1]]);
    }

    private onPointerMove(event: SelectEvent, map: Map) {
        map.getTargetElement().style.cursor = map.hasFeatureAtPixel(event.mapBrowserEvent.pixel) ? 'pointer' : '';
        
        if (event.selected.length === 1) {
            const pixel = event.mapBrowserEvent.pixel;
            const dataLayerItemId = event.selected[0].get('id');
            this.onHoverCallback(dataLayerItemId, [pixel[0], pixel[1]]);
        }
        else if (event.selected.length === 0) {
            this.onHoverEndCallback();
        }
    }

    private addGeometryToDrawLayer(geometry: Geometry, id: string): void {
        if (geometry.getType() === 'GeometryCollection') {
            (geometry as GeometryCollection)
                .getGeometries()
                .forEach(x => {
                    if (x.getType() === 'GeometryCollection') {
                        this.addGeometryToDrawLayer(x, id);
                    } else {
                        this.drawSource.addFeature(new Feature({ geometry: x }));
                    }
                });
        } else {
            const feature = new Feature({ geometry: geometry });
            feature.setProperties({ id });
            this.drawSource.addFeature(feature);
        }
    }

    private createFeaturesFromGeometryCollection(item: GeoJSONGeometrie, id: string): any[] {
        const features: any[] = [];

        if (item.type === 'GeometryCollection' && Array.isArray(item.geometries)) {
            for (const subGeometry of item.geometries) {
                const subFeatures = this.createFeaturesFromGeometryCollection(subGeometry, id);
                features.push(...subFeatures);
            }
        } else {
            features.push({
                type: 'Feature',
                geometry: {
                    ...item
                },
                properties: {
                    id: id
                }
            });
        }

        return features;
    }

    private getHighlightedStyle(feature: Feature<Geometry> | RenderFeature): Style {
        const geometryType = feature.getGeometry()?.getType();
        const getColor = (opacity = 0.2) => `rgba(225, 112, 0, ${opacity.toFixed(2)})`;
        const strokeColor = 'rgb(225, 112, 0)';

        switch (geometryType) {
            case 'Polygon':
            case 'MultiPolygon':
                return new Style({
                    fill: new Fill({
                        color: getColor(),
                    }),
                    stroke: new Stroke({
                        color: strokeColor,
                        width: 3,
                    }),
                });
            case 'LineString':
            case 'MultiLineString':
                return new Style({
                    stroke: new Stroke({
                        color: strokeColor,
                        width: 3,
                    }),
                });
            case 'Point':
            case 'MultiPoint':
                return new Style({
                    image: new CircleStyle({
                        radius: 7,
                        fill: new Fill({
                            color: strokeColor,
                        }),
                    }),
                });
            case 'GeometryCollection':
                return new Style({
                    fill: new Fill({
                        color: getColor(),
                    }),
                    stroke: new Stroke({
                        color: strokeColor,
                        width: 3,
                    }),
                    image: new CircleStyle({
                        radius: 7,
                        fill: new Fill({
                            color: getColor(),
                        }),
                    }),
                });
            default:
                throw new Error(
                    `Feature with unsupported geometry type on the map:  -> ${geometryType ?? 'null'
                    }`,
                );
        }
    }

    private getDefaultStyle(feature: Feature<Geometry> | RenderFeature): Style {
        const geometryType = feature.getGeometry()?.getType();
        const getColor = (opacity = 0.2) => `rgba(225, 112, 0, ${opacity.toFixed(2)})`;

        switch (geometryType) {
            case 'Polygon':
            case 'MultiPolygon':
                return new Style({
                    fill: new Fill({
                        color: getColor(),
                    }),
                    stroke: new Stroke({
                        color: getColor(),
                        width: 1,
                    }),
                });
            case 'LineString':
            case 'MultiLineString':
                return new Style({
                    stroke: new Stroke({
                        color: getColor(),
                        width: 8,
                    }),
                });
            case 'Point':
            case 'MultiPoint':
                return new Style({
                    image: new CircleStyle({
                        radius: 7,
                        fill: new Fill({
                            color: getColor(),
                        }),
                    }),
                });
            case 'GeometryCollection':
                return new Style({
                    fill: new Fill({
                        color: getColor(),
                    }),
                    stroke: new Stroke({
                        color: getColor(),
                        width: 1,
                    }),
                    image: new CircleStyle({
                        radius: 10,
                        fill: new Fill({
                            color: getColor(),
                        }),
                    }),
                });
            default:
                throw new Error(
                    `Feature with unsupported geometry type on the map:  -> ${geometryType ?? 'null'
                    }`,
                );
        }
    }
}