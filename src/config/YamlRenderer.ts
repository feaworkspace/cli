import * as YAML from 'yaml';
import * as z from 'zod';
import * as fs from 'fs';
import { get, set } from '../utils/ObjectUtils';

export default class YamlRenderer {
    public static readonly VARIABLE_REGEX = /\{\{ *(?<variable>[^ }]+) *}}/gi;
    private functions: Record<string, Function> = {
        readFile: (path: string) => fs.readFileSync(path, 'utf8'),
        parseYaml: YAML.parse,
        parseJson: JSON.parse
    };

    private excludedFromEvaluation: string[] = [];

    public constructor(private yaml: any) {
    }

    public withFunction(name: string, fn: Function) {
        this.functions[name] = fn;
        return this;
    }

    public with(override: any) {
        this.yaml = this.overrideObject(this.yaml, override);
        return this;
    }

    public excludeFromEvaluation(...variables: string[]) {
        this.excludedFromEvaluation.push(...variables);
        return this;
    }

    public preRenderOrFail(prop: string) {
        // @ts-ignore
        this.yaml[prop] = this.renderVariables(this.yaml[prop], prop, "fail");
        return this;
    }

    public render() {
        return this.renderVariables(this.yaml, "");
    }

    public renderOrFail() {
        return this.renderVariables(this.yaml, "", "fail");
    }

    private overrideObject(object: any, override: any) {
        if(!override) {
            return object;
        }
        for (const key in override) {
            if (typeof override[key] === 'string') {
                set(object, key, override[key]);
            } else if (typeof override[key] === 'object') {
                if(!object[key]) {
                    object[key] = override[key];
                } else {
                    object[key] = this.overrideObject(object[key], override[key]);
                }
            }
        }

        return object;
    }

    private renderVariables(object: any, path: string, ifUndefined: "let" | "fail" = "let") {
        if (typeof object === 'string') {
            const matches = object.matchAll(YamlRenderer.VARIABLE_REGEX);
            for (const match of matches) {
                if(match[0] === object) {
                    return this.evaluate(match.groups!["variable"], path, ifUndefined);
                } else {
                    object = object.replace(match[0], this.evaluate(match.groups!["variable"], path, ifUndefined));
                }
            }
            return object;
        } else if (typeof object === 'object') {
            for (const key in object) {
                const subPath = path.length === 0 ? key : path + "." + key;
                if (typeof object[key] === 'object') {
                    object[key] = this.renderVariables(object[key], subPath, ifUndefined);
                } else if(typeof object[key] === 'string') {
                    object[key] = this.renderVariables(object[key], subPath, ifUndefined);
                }
            }
            return object;
        }
    }

    public get(accessor: string): any {
        return get(this.yaml, accessor);
    }

    public evaluate(variable: string, path: string, ifUndefined: "let" | "fail" = "let") {
        variable = this.processAccessor(variable);
        for(const regex of this.excludedFromEvaluation) {
            if(variable.match(regex)) {
                return `{{ ${variable} }}`;
            }
        }
        if(variable.match(/^[a-zA-Z]+\([^)]*\)$/)) {
            const fn = new Function('functions', 'env', `const res = functions.${variable}; return typeof res === "function" ? res("${path}") : res;`);
            return fn(this.functions, this.yaml.env);
        }

        const value = this.get(variable);
        if(value === undefined && ifUndefined === "fail") {
            throw new Error(`Variable ${variable} is not defined`);
        }

        return value ?? `{{ ${variable} }}`;
    }

    public processAccessor(variable: string) {
        return variable.replace(/(^|\.| ])@/g, (match, separator) => {
            return separator + "components.";
        });
    }

    public static fromFile(fileName: string, schema?: z.ZodObject<any>) {
        const fileContent = fs.readFileSync(fileName, 'utf8');
        let yml = YAML.parse(fileContent);
        if(schema) {
            yml = schema.parse(yml);
        }
        return new YamlRenderer(yml);
    }

    public static fromObject(yaml: any, schema?: z.ZodObject<any>) {
        if(schema) {
            yaml = schema.parse(yaml);
        }
        return new YamlRenderer(yaml);
    }
}