import * as fs from 'fs';
import * as yaml from 'yaml';
import YamlRenderer from './YamlRenderer';
import { overrideObject, toArray } from "../utils/ObjectUtils";
import { workspaceComponentSchema, WorkspaceConfig, WorkspaceIncludeConfig, workspaceSchema, workspaceScriptSchema } from './types/WorkspaceConfig';
import { z, ZodSchema } from 'zod';

export default class WorkspaceConfigRenderer {
    public ymlConfig: WorkspaceConfig;
    private existingSecrets: Record<string, string> = {};

    public constructor(workspaceFile: string) {
        const workspaceYml = fs.readFileSync(workspaceFile, 'utf8');
        this.ymlConfig = yaml.parse(workspaceYml);
    }

    public async render(existingSecrets: Record<string, string>) {
        this.existingSecrets = existingSecrets;

        this.ymlConfig = this.renderYaml(this.ymlConfig);
        this.ymlConfig = workspaceSchema.parse(this.ymlConfig);

        await this.renderIncludes(this.ymlConfig.workspace.init, workspaceScriptSchema, "https://raw.githubusercontent.com/Feavy/workspace/refs/heads/main/templates/components/");
        await this.renderIncludes(this.ymlConfig.components, workspaceComponentSchema, "https://raw.githubusercontent.com/Feavy/workspace/refs/heads/main/templates/scripts/");

        this.ymlConfig = this.renderYaml(this.ymlConfig);

        return this.ymlConfig;
    }

    public async renderIncludes(object: any, schema: ZodSchema, root?: string): Promise<any> {
        if (Array.isArray(object)) {
            return Promise.all(object.map(async (item) => {
                const replacement = await this.mapInclude(item, schema, true, root);
                const index = object.indexOf(item);
                object.splice(index, 1, ...replacement);
            }));
        } else if (typeof object === 'object' && typeof object.include === 'string') {
            Object.assign(object, await this.mapInclude(object, schema, false, root));
        }
    }

    public async mapInclude(object: WorkspaceIncludeConfig & { with: any }, schema: ZodSchema, array: true, root?: string): Promise<object[]>;
    public async mapInclude(object: WorkspaceIncludeConfig & { with: any }, schema: ZodSchema, array: false, root?: string): Promise<object>;
    public async mapInclude(object: WorkspaceIncludeConfig & { with: any }, schema: ZodSchema, array: boolean, root?: string): Promise<any> {
        if(array) {
            schema = z.union([schema, z.array(schema)]);
        }

        let { include, with: override } = object;
        if(include.startsWith("@") && root) {
            include = root + include.substring(1);
        }
        const content = include.startsWith("http") ? await fetch(include).then(res => res.text()) : await fs.promises.readFile(include, 'utf8');
        let yml = schema.parse(yaml.parse(content));
        if(Array.isArray(yml)) {
            yml.forEach(object => {
                delete (object as any).include;
                delete (object as any).with;
            });
        } else {
            delete (object as any).include;
            delete (object as any).with;
        }

        yml = overrideObject(yml, override);

        
        yml = new YamlRenderer(yml)
            .renderOrFail();

        if(!Array.isArray(yml) && array) {
            yml = [yml];
        }

        return yml;
    }

    private renderYaml(yaml: any) {
        return YamlRenderer.fromObject(yaml)
          .with({ env: process.env })
        //   .withFunction("randomPassword", this.randomPassword)
        //   .withFunction("host", this.host.bind(this))
        //   .preRenderOrFail("secrets")
          .renderOrFail();
    }

    public randomPassword = (length: number = 32) => (path: string) => {
        const key = path.replace("secrets.", "");
        if(key in this.existingSecrets) {
            return this.existingSecrets[key];
        }
        const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        return Array.from({ length }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
    }

    public host(host: string) {
        return `${host.replace(".", "-")}.${this.ymlConfig.namespace}.svc.cluster.local`;
    }
}