<template>
    <div class="omgevingscontext-verzoeken-container" v-if="isVerzoekenDataLayerActive">      
        <div class='filter-panel' v-on:click="expand()">
            <div :class="isFilterPanelExpanded ? 'filter-panel-expanded-name' : ''">Filters</div>
            <div class='filter-panel-expander'>
                <i v-if="isFilterPanelExpanded" class="ico-chevron-up"></i>
                <i v-else class="ico-chevron-down"></i>
            </div>
        </div>

        <v-form v-show="isFilterPanelExpanded" ref="form">
            <v-autocomplete dense attach multiple small-chips deletable-chips
                id="omgevingscontext-filters-bevoegdgezag"
                label="Bevoegd gezag"
                no-data-text="Geen bevoegd gezagen gevonden"
                v-model="verzoekenRequest.bevoegdgezag"
                :loading="isLoadingOrganizations"
                :items="bevoegdgezag"
                :item-text="(item) => item.name"
                :item-value="(item) => item.rsin">                        
            </v-autocomplete>
        
            <v-autocomplete dense attach multiple small-chips deletable-chips
                id="omgevingscontext-filters-behandeldienst"
                label="Behandeldienst"
                no-data-text="Geen behandeldiensten gevonden"
                v-model="verzoekenRequest.behandeldienst"
                :loading="isLoadingOrganizations"
                :items="behandeldienst"
                :item-text="(item) => item.name"
                :item-value="(item) => item.rsin">                        
            </v-autocomplete>
            
            <div class="omgevingscontext-filters-dates">
                <DateInput 
                    id="omgevingscontext-filters-startdatumingediendop"
                    label="Start datum ingediend op"
                    :date="verzoekenRequest.startdatumingediendop"
                    v-model="verzoekenRequest.startdatumingediendop"
                    :rules="startdatumingediendopBeforeEnd">
                </DateInput>
            
                <DateInput 
                    id="omgevingscontext-filters-einddatumingediendop"
                    label="Eind datum ingediend op"
                    :date="verzoekenRequest.einddatumingediendop"
                    v-model="verzoekenRequest.einddatumingediendop"
                    :rules="einddatumingediendopBeforeStart">
                </DateInput>
            </div>
            
            <v-text-field dense 
                id="omgevingscontext-filters-verzoeknummer"
                label="Verzoeknummer"
                v-model="verzoekenRequest.verzoeknummer"
                :rules="verzoekenFields.verzoeknummer.rules">
            </v-text-field>
        </v-form> 

        <div class="total-container">
            <v-tooltip left open-delay="200" :disabled="!shouldZoomInFurther">
                <template v-slot:activator="{on}">
                    <span v-on="on">
                        <v-btn raised small 
                            elevation="2"
                            :loading="isSearchingVerzoeken"
                            :disabled="shouldZoomInFurther"
                            @click="searchVerzoeken"
                            color="accent"
                            id="submit-verzoekens-filter">
                            Filter verzoeken
                        </v-btn>
                    </span>
                </template>
                Zoom verder in om te kunnen zoeken
            </v-tooltip>

            <div class="total">
                Totaal aantal verzoeken gevonden: {{ verzoekenList.length }}
            </div>
        </div>
    
        <div class="omgevingscontext-submit-verzoeken-filter" v-if="verzoekenList.length > 0">
            <div 
                v-for="(item) in verzoekenList" 
                :key="item.verzoeknummer"                   
                :class="['omgevingscontext-verzoek-result', isHovered(item.verzoeknummer) ? 'hover' : '']" 
                @mouseenter="onHover(item.verzoeknummer)"
                @mouseleave="onHoverEnd()"
                @click="onClick(item.verzoeknummer)">
                    <div>
                        <div class="verzoek-search-result-verzoektype-datumIngediend">
                            {{ concatenateValues([item.verzoekType, item.datumIngediend ? formateDate(item.datumIngediend) : '']) }}
                        </div>
                        <div class="verzoek-search-result-verzoeknummer-doelVerzoek">
                            {{ concatenateValues([item.verzoeknummer, item.doelVerzoek]) }}
                        </div>
                        <div class="verzoek-search-result-bevoegdGezagNaam-behandeldienstNaam">
                            {{ concatenateValues([item.bevoegdGezagNaam, item.behandeldienstNaam]) }}
                        </div>
                    </div>
            </div>
        </div>
    </div>
    <div v-else>
        <span>Er zijn geen datalagen actief. Activeer een datalaag om meer gegevens te zien.</span>
    </div>
</template>

<script lang="ts">
    import { Component, Ref, Vue } from 'vue-property-decorator';
    import { ValidatableForm } from '@/models/rules';
    import { DateOnly } from '@/models/dateOnly';
    import { VerzoekDsoSearchResult, VerzoekenRequest } from '@/models/verzoeken/verzoeken';
    import { DataLayerMinimumZoomLevel, DataLayers, VerzoekTypeItems } from '@/models/constants';
    import { OrganizationModule } from '@/store/modules/organization.module';
    import { OrganizationType } from '@/models/organization';
    import { dateNotBeforeRule, dateBeforeRule } from '@/models/rules';
    import { formatDateNumeric } from '@/filters/date';
    import DateInput from  '@/components/shared/controls/DateInput.vue';
    import SidebarModule from '@/store/modules/sidebar.module';
    import VerzoekDetailSidebar from './VerzoekDetailSidebar.vue';
    import VerzoekenFilterModule from '@/store/modules/verzoeken-filter.module'
    import EnvironmentContextModule from '@/store/modules/environment-context.module';

    @Component({
        components: { DateInput }
    })
    export default class Omgevingscontext extends Vue {
        @Ref("form") form!: ValidatableForm;      

        verzoekenRequest: VerzoekenRequest = new VerzoekenRequest();
        verzoekenFields: typeof VerzoekenRequest.fields = VerzoekenRequest.fields;

        allowedTypesBehandeldienst: OrganizationType[] = [OrganizationType.Gemeente, OrganizationType.Provincie, OrganizationType.Waterschap, OrganizationType.Rijksoverheid, OrganizationType.Omgevingsdienst, OrganizationType.Samenwerkingsverband];
        allowTypesBevoegdgezag: OrganizationType[] = [OrganizationType.Gemeente, OrganizationType.Provincie, OrganizationType.Waterschap, OrganizationType.Rijksoverheid];
        
        isLoadingOrganizations: boolean = false;
        isSearchingVerzoeken: boolean = false;

        get startdatumingediendopBeforeEnd() {
            return [
                dateBeforeRule(this.verzoekenRequest.einddatumingediendop)
            ];
        }

        get einddatumingediendopBeforeStart() {
            return [
                dateNotBeforeRule(this.verzoekenRequest.startdatumingediendop)
            ];
        }

        get bevoegdgezag() {
            return OrganizationModule.organizations
                .filter(o => this.allowTypesBevoegdgezag.includes(o.type))
                .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
        }

        get behandeldienst() {
            return OrganizationModule.organizations
                .filter(o => this.allowedTypesBehandeldienst.includes(o.type))
                .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
        }

        get verzoekenList() {
            return VerzoekenFilterModule.items.filter((value: VerzoekDsoSearchResult, index: number, self: VerzoekDsoSearchResult[]) => {
                const firstIndex = self.findIndex((obj: VerzoekDsoSearchResult) => obj.verzoeknummer === value.verzoeknummer);
                return index === firstIndex;
            });
        }

        get verzoekTypen() {
            return VerzoekTypeItems;
        }

        get isVerzoekenDataLayerActive() {
            return EnvironmentContextModule.activeDataLayers.some(x => x === DataLayers.Verzoeken);
        }

        get shouldZoomInFurther() {
            return EnvironmentContextModule.zoomLevel < DataLayerMinimumZoomLevel;
        }

        get visibleExtent() {
            return EnvironmentContextModule.visibleExtent;
        }

        get isFilterPanelExpanded() {
            return VerzoekenFilterModule.isFilterPanelExpanded;
        }

        formateDate(datumIngediend: DateOnly) {
            return formatDateNumeric(datumIngediend);
        }

        concatenateValues(values: string[]) {
            const filteredProperties = values.filter(x => !!x);
            if (filteredProperties.length >= 2) {
                return filteredProperties.join(' | ');
            }
            
            return filteredProperties.toString();
        }

        onClick(verzoeknummer: string) {
            VerzoekenFilterModule.setSelectedVerzoeknummer(verzoeknummer);
            const beforeDestroy = () => VerzoekenFilterModule.setSelectedVerzoeknummer(null);
            SidebarModule.push([VerzoekDetailSidebar, { verzoeknummer }, false, false, beforeDestroy]);
        }

        expand() {
            VerzoekenFilterModule.setFilterPanelExpanded(!VerzoekenFilterModule.isFilterPanelExpanded);
        }

        onHover(verzoeknummer: string) {
            VerzoekenFilterModule.setHoveredVerzoeknummer(verzoeknummer);
        }

        onHoverEnd() {
            VerzoekenFilterModule.setHoveredVerzoeknummer(null);
        }

        isHovered(verzoeknummer: string) {
            return VerzoekenFilterModule.hoveredVerzoeknummer === verzoeknummer;
        }
        
        async searchVerzoeken() {
            if (this.form.validate()) {
                this.isSearchingVerzoeken = true;

                if (!this.verzoekenRequest.verzoeknummer) {
                    this.verzoekenRequest.geometrie = this.visibleExtent;
                }

                VerzoekenFilterModule.setFilterProps(this.verzoekenRequest);
                await VerzoekenFilterModule.getVerzoekenFromDso(this.verzoekenRequest);
                this.isSearchingVerzoeken = false;
            } 
        }

        async created() {
            this.verzoekenRequest = VerzoekenFilterModule.verzoekenRequest;
            this.isLoadingOrganizations = true;
            await OrganizationModule.listOrganizations();
            this.isLoadingOrganizations = false;
        }
    }
</script>

<style scoped>
    .omgevingscontext-verzoeken-container {
        margin-top: 15px;
    }

    .total-container {
        display: flex;
    }

    .total {
        margin-left: var(--panel-padding);
    }

    .omgevingscontext-verzoek-result {
        padding: 5px;
        margin-top: 5px;
    }

    .omgevingscontext-verzoek-result.hover {
        background-color: var(--panel-color-hover);
        cursor: pointer;
    }

    form > div:not(:last-child) {
        padding-bottom: 15px;
    }

    .omgevingscontext-filters-dates {
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-template-rows: 1fr;
        column-gap: 10px;
    }

    .verzoek-search-result-verzoeknummer-doelVerzoek, 
    .verzoek-search-result-bevoegdGezagNaam-behandeldienstNaam {
        font-size: 85%;
    }

    .filter-panel {
        display: grid;
        grid-template-columns: 1fr auto;
        grid-template-rows: 1fr;
        cursor: pointer;
        padding-bottom: 10px;
    }

    .filter-panel-expander {
        grid-row: 1;
        grid-column: 2;
    }

    .filter-panel-expanded-name {
        font-weight: 700;
    }
</style>