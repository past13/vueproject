<template>
    <div class="omgevingsdossier-loading"
        v-if="loading">
        <i class="ico-rui-bezig"></i> 
        De omgevingsdossiers worden geladen...        
    </div>
    <div class="omgevingsdossier-pma" v-else>
        <div class="omgevingsdossier-list">
            <EnvironmentalDossierItem 
                v-for="(omgevingsdossier,ix) in omgevingsdossiers" 
                :key="omgevingsdossier.id"
                :omgevingsdossier="omgevingsdossier" 
                :class="`omgevingsdossier-${ix}`"
                @remove="remove(omgevingsdossier)"
            >
            </EnvironmentalDossierItem>
        </div>

        <v-btn raised small
            v-if="!omgevingsdossiers.length"
            elevation="2"
            color="primary"
            :loading="loading"
            :disabled="loading"
            v-on:click="addDossier"
            id="add-dossier-button">
            Omgevingsdossier koppelen
        </v-btn>

        <v-btn raised small 
            v-else
            elevation="2"
            :loading="loading"
            :disabled="loading"
            v-on:click="addDossier"
            id="add-dossier-button">
            Nog een omgevingsdossier koppelen
        </v-btn>
    </div>
</template>

<script lang="ts">
import { Omgevingsdossier } from "@/models/process/environmentalDossier";
import { Component, Vue } from "vue-property-decorator";
import ActionMenuDropdown from "../shared/actions/ActionMenuDropdown.vue";
import EnvironmentalDossierItem from "./environmentalDossier/EnvironmentalDossierItem.vue";
import OmgevingsdossiersModule from "@/store/modules/omgevingsdossier/omgevingsdossiers.module";
import ProcessModule from "@/store/modules/process.module";
import SidebarModule from "@/store/modules/sidebar.module";
import AddEnvironmentalDossierSidebar from "./environmentalDossier/AddEnvironmentalDossierSidebar.vue";
import { getProcessPageTitle } from "@/helpers/process";

@Component({
    components: { ActionMenuDropdown, EnvironmentalDossierItem }
})
export default class ProcessEnvironmentalDossier extends Vue {
    private get processId(): string {
        return ProcessModule.process.id;
    }

    get loading(): boolean {
        return !OmgevingsdossiersModule.initialized || OmgevingsdossiersModule.loading || OmgevingsdossiersModule.failure;
    }

    get omgevingsdossiers(): Array<Omgevingsdossier> { 
        return OmgevingsdossiersModule.item.omgevingsdossiers;
    }

    addDossier() {
        SidebarModule.push([AddEnvironmentalDossierSidebar, {}, false, false]);
    }

    async remove(omgevingsdossier: Omgevingsdossier) {
        await OmgevingsdossiersModule.remove([this.processId, omgevingsdossier.id]);
        OmgevingsdossiersModule.get([this.processId]);
    }

    get process() {
        return ProcessModule.process;
    }

    mounted() {
        document.title = getProcessPageTitle(this.process.case.identificatie, this.process.globalLocation, 'Omgevingsdossier');
        OmgevingsdossiersModule.get([this.processId]);
    }

    beforeDestroy() {
        SidebarModule.reset();
    }
}
</script>

<style scoped>
.omgevingsdossier-list { 
    padding-bottom: 10px;
}
</style>