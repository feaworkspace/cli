import WorkspaceConfigRenderer from './config/WorkspaceConfigRenderer.js';
import { fromError } from 'zod-validation-error';
import KubernetesWorkspace from './kubernetes/KubernetesWorkspace.js';
import * as yaml from 'yaml'
import { lib, lib2 } from '@workspace/lib'

import * as path from 'path';

console.log(lib(), lib2());

try {
    if(import.meta.env?.DEV) {
        console.log('Running in development mode');
    } else {
        console.log('Running in production mode');
    }
    console.log(import.meta.env);
    const configRenderer = new WorkspaceConfigRenderer('workspace.yml');
    const workspaceConfig = configRenderer.render();

    const kubernetesWorkspace = new KubernetesWorkspace(workspaceConfig);
    const resources = kubernetesWorkspace.getResources();
    console.log(resources.map(resource => yaml.stringify(resource.config)).join('---\n'));
    // console.log(workspaceConfig.toYaml());
} catch (error: any) {
    const validationError = fromError(error);
    console.error(error);
    console.error(validationError.toString());
}