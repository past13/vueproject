import { DateOnly } from "../dateOnly";
import { VerzoekDoel, VerzoekType } from "../process-model-definition";
import { FieldRules, greaterThanOrEqualRule, isIntegerRule, lowerThanOrEqualRule, MaxLengthRule, MinLengthRule, requiredRule, Rules } from "../rules";

export class Activiteit {
    constructor(public id: string,
        public url: string,
        public code: string,
        public naam: string,
        public label: string,
        public publiekeOmschrijving: string,
        public imowId: string,
        public vraagGroepen: Array<VraagGroep>,
        public volgnummer: number | null,
        public regelsOpDeKaartUrl: string,
        public vervallen: boolean,
        public bopa: boolean,
        public bron: string,
        public omgevingsobjectActiviteitId: string | null,
        public omgevingsobjectActiviteitTypeId: string | null,
        public omgevingsobjectHoofdvoorkomenId: string | null,
        public omgevingsobjectHoofdvoorkomenTypeId: string | null) { }
}

export class VraagGroep {
    constructor(public naam: string,
        public vragen: Array<Vraag>) { }
}

export class Vraag {
    constructor(public vraagId: string, 
        public vraagTekst: string,
        public antwoord: string | null,
        public volgordenummer: number,
        public verzoekVolgnummer: string,
        public antwoordHistorie: Array<AntwoordHistorie>) { }
}

export class AntwoordHistorie {
    constructor(public antwoord: string,
        public verzoekVolgnummer: string) { }
    }

export class VerzoekByBronAndAanvraagnummerProjection {
    constructor(public verzoek: Verzoek,
        public verzoekProcessesCaseInformation: Array<VerzoekProcessCaseInformation>) { }
}

export class VerzoekProcessCaseInformation {
    constructor(public pmaProcessId: string,
        public caseUrl: string,
        public caseTypeDescription: string,
        public status: string,
        public caseDescription: string) { }
}

export class Verzoek {
    constructor(public id: string,
        public bron: string,
        public nummer: string,
        public volgnummer: string | null,
        public naam: string,
        public toelichting: string,
        public toelichtingNietLeveren: string | null,
        public toelichtingLaterLeveren: string | null,
        public projectNaam: string,
        public projectomschrijving: string,
        public projectId: string,
        public referentieAanvrager: string | null,
        public indienDatum: Date,
        public type: string,
        public doel: string,
        public ambtshalve: boolean,
        public bevoegdGezagRsin: string,
        public behandelendeOrganisatieRsin: string,
        public geparticipeerd: boolean | null,
        public participatieWijze: string,
        public participatieResultaat: string,
        public eindoordeel: string | null,
        public activiteiten: Array<Activiteit>,
        public situaties: Array<Situation>,
        public otherSituaties: Array<Situation>,
        public historie: Array<VerzoekHistorie>,
        public indieningen: Array<Indiening>,
        public processen: Array<VerzoekProcess> | null) { }
}

export class VerzoekProcess {
    constructor(public id: string,
        public organisatieId: string,
        public organisatieRsin: string,
        public zaaknummer: string,
        public zaakUrl: string) { }
}
    
export class SearchVerzoekRequest {
    constructor(public aanvraagnummer: number | null = null, 
        public aanvraagnaam: string | null = null, 
        public bron: string | null = null, 
        public locatie: string | null = null,
        public zaaknummer: string | null = null) {}
}
    
export class SearchVerzoekResponse {
    constructor(public count: number = 0, 
        public next: string | null = null, 
        public previous: string | null = null, 
        public results: Array<VerzoekSearchResult> = []) {}
}
    
export class VerzoekSearchResult {
    constructor(public id: string,
        public bron: string,
        public nummer: string,
        public naam: string, 
        public type: string,
        public doel: string,
        public indienDatum: Date,
        public locatieOmschrijving: string,
        public zaken: Array<VerzoekSearchZaak>) {}
    }

export class VerzoekSearchZaak {
    constructor(public zaaknummer: string,
        public zaakUrl: string) {}
}

export class SituationSearchResult {
    constructor(public id: string,
        public omgevingsObjectNaam: string,
        public omgevingsObjectTypeNaam: string,
        public aanleiding: string | null,
        public bewerkStatus: string,
        public aanmaakDatum: Date | null,
        public geldigVan: Date | null,
        public geldigTotEnMet: Date | null,
        public globaleLocatie: string,
        public adresWeergave: string) {}
}

export class SoortBouwwerken {
    constructor(
        public code: string,
        public name: string,
        public value: string | null) { }
}

export class Bedrijfstak {
    constructor(
        public code: string,
        public name: string,
        public value: string | null) { }
}

export class VerzoekHistorie {
    constructor(public volgnummer: string,
        public referentieAanvrager: string | null,
        public toelichtingLaterLeveren: string | null,
        public toelichtingNietLeveren: string | null,
        public toelichting: string,
        public projectNaam: string,
        public projectomschrijving: string,
        public projectId: string,
        public geparticipeerd: boolean | null,
        public participatieWijze: string,
        public participatieResultaat: string,
        public datumAangemaakt: Date) { }
}

export class Indiening {
    constructor(public volgnummer: string,
        public indienDatum: Date) { }
}

export class Situation {
    constructor(public id: string,
        public omgevingsObject: EnvironmentObject,
        public activiteitenEnVoorzieningen: ActivitiesAndFacilities[]) { }
}

export class EnvironmentObject {
    constructor(public naam: string,
        public omgevingsobjecttypeId: string,
        public omgevingsobjecttypeNaam: string) { }
}

export class ActivitiesAndFacilities {
    constructor(public id: string,
        public bewerkStatus: string,
        public oordeel: string | null,
        public omgevingsObject: EnvironmentObject) { }
}

export class ActivityVerdictRequest {
    constructor(public verdict: string | null,
        public situatieId: string,
        public activityId: string) { }

    public static fields = {
        verdict: new FieldRules("Verdict", new Rules())
    };
}

export class UpdateActivityRequest {
    constructor(public vervallen: boolean, public bopa: boolean) { }
}

export class Specificatie {
    constructor(public activiteitId: string,
        public activiteitUrl: string,
        public activiteitNaam: string,
        public activiteitLabel: string,
        public vraagId: string,
        public vraagTekst: string,
        public antwoord: string,
        public vraagGroep: string,
        public volgnummer: string) { }
}

export class VerzoekFinalVerdictRequest {
    constructor(public eindoordeel: string | null) { }

    public static fields = {
        eindoordeel: new FieldRules("Eindoordeel", new Rules())
    };
}

export class OverwegingDetails  {
    constructor(public overweging: string,
        public intern: boolean) { }
}

export class Overweging extends OverwegingDetails {
    constructor(public processId: string,
        public activityId: string,
        public overwegingId: string = '',
        overweging: string = '',
        intern: boolean = false,
        public volgnummer: number = 1, 
        public createdBy: string = '',
        public createdOn: Date = new Date( Date.now() ),
        public updatedBy: string = '',
        public updatedOn: Date = new Date( Date.now() )) {
            super( overweging, intern );
        }

    public static fields = {
        overweging: new FieldRules("Overweging", new Rules(requiredRule()))
    };
}

export class CreateVerzoekRequest {
    constructor(public activitytypes: Array<string> = [],
        public toelichting: string = '',
        public verzoekType: VerzoekType | null = null,
        public verzoekDoel: VerzoekDoel | null = null) { }

    public static fields = {
        toelichting: new FieldRules("Toelichting", new Rules(MaxLengthRule(200))),
        verzoekType: new FieldRules("VerzoekType", new Rules(requiredRule())),
        verzoekDoel: new FieldRules("VerzoekDoel", new Rules(requiredRule()))
    };
}

export class PatchVerzoekBouwgegevensRequest {
    constructor(
        public datumVergunning? : DateOnly | null,
        public bouwkosten? : number | null,
        public inhoud? : number | null,
        public oppervlakte? : number | null,
        public aardWerkzaamheden? : number,
        public liggingBouwwerk? : string | null,
        public woonplaats? : string | null,
        public postcodegebied? : string | null,
        public soortBouwwerkId? : string | null,
        public bedrijfstakId? : string | null,
        public opdrachtgeverType? : number,
        public opdrachtgeverNaam? : string | null,
        public aantalWoningenHuur? : number | null,
        public aantalRecreatiewoningenEigen? : number | null,
        public aantalWoningenEigen? : number | null,
        public aantalWooneenhedenHuur? : number | null,
        public aantalWooneenhedenEigen? : number | null,
        public aantalRecreatiewoningenHuur? : number | null) { }

        public static fields = {
            liggingBouwwerk: new FieldRules("LiggingBouwwerk", new Rules(MaxLengthRule(32))),
            woonplaats: new FieldRules("Woonplaats", new Rules(MaxLengthRule(18))),
            bouwkosten: new FieldRules("Bouwkosten", new Rules(isIntegerRule(), greaterThanOrEqualRule(0), lowerThanOrEqualRule(9999999999))),
            postcodegebied: new FieldRules("Postcodegebied", new Rules(isIntegerRule(), MinLengthRule(4), MaxLengthRule(4))),
            inhoud: new FieldRules("Inhoud", new Rules(isIntegerRule(), greaterThanOrEqualRule(0), lowerThanOrEqualRule(9999999))),
            oppervlakte: new FieldRules("Oppervlakte", new Rules(isIntegerRule(), greaterThanOrEqualRule(0), lowerThanOrEqualRule(9999999))),
            aantalWoningenHuur: new FieldRules("Oppervlakte", new Rules(isIntegerRule(), greaterThanOrEqualRule(0), lowerThanOrEqualRule(9999))),
            aantalRecreatiewoningenEigen: new FieldRules("Oppervlakte", new Rules(isIntegerRule(), greaterThanOrEqualRule(0), lowerThanOrEqualRule(9999))),
            aantalWoningenEigen: new FieldRules("Oppervlakte", new Rules(isIntegerRule(), greaterThanOrEqualRule(0), lowerThanOrEqualRule(9999))),
            aantalWooneenhedenHuur: new FieldRules("Oppervlakte", new Rules(isIntegerRule(), greaterThanOrEqualRule(0), lowerThanOrEqualRule(9999))),
            aantalWooneenhedenEigen: new FieldRules("Oppervlakte", new Rules(isIntegerRule(), greaterThanOrEqualRule(0), lowerThanOrEqualRule(9999))),
            aantalRecreatiewoningenHuur: new FieldRules("Oppervlakte", new Rules(isIntegerRule(), greaterThanOrEqualRule(0), lowerThanOrEqualRule(9999)))
        };
}

export class Bouwgegevens {
    constructor(
        public datumVergunning : DateOnly | null,
        public bouwkosten : number | null,
        public inhoud : number | null,
        public oppervlakte : number | null,
        public aardWerkzaamheden : number,
        public liggingBouwwerk : string | null,
        public woonplaats : string | null,
        public postcodegebied : string | null,
        public soortBouwwerkId: string | null,
        public bedrijfstakId: string | null,
        public opdrachtgeverType : number,
        public opdrachtgeverNaam : string | null,
        public aantalWoningenHuur : number | null,
        public aantalRecreatiewoningenEigen : number | null,
        public aantalWoningenEigen : number | null,
        public aantalWooneenhedenHuur : number | null,
        public aantalWooneenhedenEigen : number | null,
        public aantalRecreatiewoningenHuur : number | null) { }
}

export class RelateActivitySituationRequest {
    constructor(public verzoekId: string,
        public activityId: string,
        public situationId: string,
        public createNewConcept: boolean) {}
}

export class CreateRelateActivitySituationRequest {
    constructor(public verzoekId: string,
        public activityId: string) { }
}

export class SituationSearchRequest {
    constructor(public searchTerm: string,
        public excludeOtherOrganizations: boolean) { }

    public static fields = {
        searchTerm: new FieldRules("SearchTerm", new Rules(requiredRule(), MinLengthRule(3))),
    };        
}