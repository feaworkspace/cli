import * as fs from 'fs';
import * as yaml from 'yaml';
import { Include, MergedYamlConfig, yamlComponentsSchema, YamlConfig, yamlConfigSchema, YamlTemplate, yamlTemplateSchema } from './WorkspaceConfigTypes.js';
import WorkspaceConfig from './WorkspaceConfig.js';

export default class WorkspaceConfigRenderer {
    private static readonly VARIABLE_REGEX = /\${(?<variable>[^}:]+(:(?<default_value>[^}]+))?)}/g;

    private ymlConfig: YamlConfig;

    public constructor(workspaceFile: string) {
        const workspaceYml = fs.readFileSync(workspaceFile, 'utf8');
        this.ymlConfig = yaml.parse(workspaceYml);
    }

    public render() {
        return this.renderVariables(
            this.mergeIncludes(
                yamlConfigSchema.parse(this.ymlConfig)
            )
        );
    }

    public mergeIncludes(config: YamlConfig): MergedYamlConfig {
        const components = config.components.flatMap((component) => {
            if ('include' in component) {
                return this.renderInclude(component);
            } else {
                return component;
            }
        });
        config.components = components;
        return config as MergedYamlConfig;
    }

    public renderInclude(include: Include) {
        const includeYml = fs.readFileSync(include.include, 'utf8');
        const includeConfig = yaml.parse(includeYml);
        let yamlTemplate = yamlTemplateSchema.parse(includeConfig);
        const variables = this.objectToVariables(include.override);
        if (variables.length > 0) {
            this.setVariables(yamlTemplate, variables);
        }
        return yamlTemplate.components;
    }

    public setVariables(context: YamlTemplate, variables: Array<{ name: string, value: any }>) {
        for (const variable of variables) {
            this.getVariable(variable.name, context).set(variable.value);
        }
    }

    public renderVariables(object: any, context: YamlTemplate = object) {
        if (typeof object === 'string') {
            return object.replace(WorkspaceConfigRenderer.VARIABLE_REGEX, (match, variable, _, defaultValue) => {
                return process.env[variable] || defaultValue || this.getVariable(variable, context).get() || '';
            });
        } else if (typeof object === 'object') {
            for (const key in object) {
                if (typeof object[key] === 'string') {
                    object[key] = this.renderVariables(object[key], context);
                } else if (typeof object[key] === 'object') {
                    object[key] = this.renderVariables(object[key], context);
                }
            }
            return object;
        }
    }

    private objectToVariables(object: any, prefix: string = '') {
        const variables: Array<{ name: string, value: any }> = [];
        for (const key in object) {
            if (typeof object[key] === 'string') {
                variables.push({ name: prefix + key, value: object[key] });
            } else if (typeof object[key] === 'object') {
                variables.push(...this.objectToVariables(object[key], prefix + key + '.'));
            }
        }
        return variables;
    }

    private getVariable(variable: string, context: YamlTemplate) {
        const parts = variable.split('.');
        const firstPart = parts.shift();
        let value = firstPart === 'global' ? context : context.components.find((component) => component.name === firstPart);
        let entry = null;
        let key = firstPart;
        for (const part of parts) {
            if (!value) {
                key = undefined;
                break;
            }
            // @ts-ignore
            if (value[part]) {
                entry = value;
                key = part;
                // @ts-ignore
                value = value[part];
            } else {
                key = undefined;
                value = undefined;
            }
        }
        return {
            get() {
                return value;
            },
            set(newValue: any) {
                if (entry !== null) {
                    // @ts-ignore
                    entry[key] = newValue;
                }
            },
        };
    }

}