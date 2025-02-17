import { Component, MergedYamlConfig, Repository } from "./WorkspaceConfigTypes.js";
import * as yaml from 'yaml';

export default class WorkspaceConfig {
    public constructor(
        public version: number,
        public namespace: string,
        public workspaceComponent: string,
        public subdomainFormat: string,
        public repositories: Repository[],
        public components: Component[]
    ) {
    }

    public toYaml() {
        return yaml.stringify({
            version: this.version,
            namespace: this.namespace,
            workspace: this.workspaceComponent,
            subdomainFormat: this.subdomainFormat,
            repositories: this.repositories,
            components: this.components
        });
    }

    public static fromYaml(yaml: MergedYamlConfig): WorkspaceConfig {
        return new WorkspaceConfig(
            yaml.version,
            yaml.namespace,
            yaml.workspace,
            yaml.subdomainFormat,
            yaml.repositories,
            yaml.components
        );
    }
}