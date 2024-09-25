import { Module, Mutation, VuexModule, Action, getModule } from 'vuex-module-decorators';
import { VerzoekenRequest, VerzoekDsoSearchResult, GetVerzoekenByBronAanvraagnummerRequest } from '@/models/verzoeken/verzoeken';
import { apiClient } from '@/clients/apiClient';
import store from '@/store';
import { VerzoekByBronAndAanvraagnummerProjection } from '@/models/process/verzoek';
import { NotFound } from '@/models/httpResponse/notFound';

export interface IVerzoekenFilterState {
    hoveredVerzoeknummer: string | null;
    selectedVerzoeknummer: string | null;
    items: Array<VerzoekDsoSearchResult>;
    getVerzoekByBronAndAanvraagnummerResult: VerzoekByBronAndAanvraagnummerProjection | null;
    verzoekenRequest: VerzoekenRequest;
    isFilterPanelExpanded: boolean;
    getVerzoekenFromDso(verzoekenRequest: VerzoekenRequest): Promise<void>;
    setHoveredVerzoeknummer(item: string | null): void;
    getVerzoekByBronAndAanvraagnummer(verzoekenRequest: GetVerzoekenByBronAanvraagnummerRequest): Promise<void>;
    setSelectedVerzoeknummer(item: string | null): void;
    setFilterProps(verzoekenfilter: VerzoekenRequest): void;
    setFilterPanelExpanded(isExpanded: boolean): void;
}

@Module({ namespaced: true, name: 'verzoekenfilter', dynamic: true, store })
class VerzoekenFilterState extends VuexModule implements IVerzoekenFilterState {
    public hoveredVerzoeknummer: string | null = null;
    public selectedVerzoeknummer: string | null = null;
    public items: Array<VerzoekDsoSearchResult> = [];
    public getVerzoekByBronAndAanvraagnummerResult: VerzoekByBronAndAanvraagnummerProjection | null = null;
    public verzoekenRequest: VerzoekenRequest = new VerzoekenRequest();
    public isFilterPanelExpanded: boolean = false;

    @Action({ rawError: true })
    public async getVerzoekenFromDso(verzoekenRequest: VerzoekenRequest) {
        const response = await apiClient.post<VerzoekDsoSearchResult[]>(`/api/v0-internal/verzoekendso/search`, verzoekenRequest);
        if (response.status === 200) {
            this.setVerzoeken(response.data);
        }
        else {
            throw Error(`Received unexpected http response: ${response.status} (${response.statusText})`);
        }
    }
    
    @Action({ rawError: true })
    public async getVerzoekByBronAndAanvraagnummer(verzoekenRequest: GetVerzoekenByBronAanvraagnummerRequest) {    
        try {
            const response = await apiClient.get<VerzoekByBronAndAanvraagnummerProjection>(`/api/v0-internal/process/${verzoekenRequest.processId}/verzoek/${verzoekenRequest.bron}/${verzoekenRequest.aanvraagnummer}`);
            if (response.status === 200) {
                this.setVerzoekByBronAndAanvraagnummerResult(response.data);
            }
            else {
                throw Error(`Received unexpected http response: ${response.status} (${response.statusText})`);
            }
        }
        catch (e) {
            if (e instanceof NotFound) {
                this.setVerzoekByBronAndAanvraagnummerResult(null);
            }
            else {
                throw e;
            }
        }
    }

    @Mutation
    public setFilterProps(verzoekenfilter: VerzoekenRequest) {
        this.verzoekenRequest = verzoekenfilter;
    }

    @Mutation
    public setHoveredVerzoeknummer(verzoeknummer: string | null): void {
        this.hoveredVerzoeknummer = verzoeknummer;
    }

    @Mutation
    public setSelectedVerzoeknummer(verzoeknummer: string | null): void {
        this.selectedVerzoeknummer = verzoeknummer;
    }
    
    @Mutation
    public setVerzoeken(verzoeken: VerzoekDsoSearchResult[]): void {
        this.items = verzoeken.map((x) => {
            x.id = x.verzoeknummer;
            return x;
        });
    }

    @Mutation
    public setVerzoekByBronAndAanvraagnummerResult(getVerzoekByBronAndAanvraagnummerResult: VerzoekByBronAndAanvraagnummerProjection | null): void {        
        this.getVerzoekByBronAndAanvraagnummerResult = getVerzoekByBronAndAanvraagnummerResult;          
    }

    @Mutation
    public setFilterPanelExpanded(isExpanded: boolean) {
        this.isFilterPanelExpanded = isExpanded;
    }
}

export const VerzoekenFilterModule = getModule(VerzoekenFilterState) as IVerzoekenFilterState;
export default VerzoekenFilterModule;
