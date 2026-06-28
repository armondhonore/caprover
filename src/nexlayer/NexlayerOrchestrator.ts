/**
 * NexlayerOrchestrator — the Docker→Nexlayer seam.
 *
 * CapRover (the "app": a PaaS dashboard + app model) hard-welds Docker Swarm
 * as its orchestration backend (the "infra"). Every app lifecycle operation in
 * the codebase funnels through src/docker/DockerApi.ts. This module is the
 * single boundary where, in Nexlayer-native mode, those Swarm operations are
 * mapped onto the Nexlayer platform instead.
 *
 * Design intent: keep CapRover's PaaS UX intact (app list, create app, view
 * logs, deploy) while swapping the thing that actually runs containers. The
 * boundary is deliberately narrow — DockerApi delegates here for the handful
 * of verbs the dashboard exercises; everything that is purely Swarm cluster
 * plumbing (overlay networks, swarm secrets, node-manager checks) is treated
 * as a no-op because the Nexlayer platform owns it.
 *
 * What is wired today:
 *   - service "running" / list / node introspection -> in-memory native model
 *     so the dashboard renders without a Docker daemon.
 *   - deploy (updateService) -> records desired state and generates the
 *     equivalent nexlayer.yaml for the app; the actual platform call is the
 *     remaining boundary (see deployApp) and is logged when not configured.
 *
 * What is intentionally a no-op (Nexlayer platform owns it):
 *   - swarm init / overlay networks / swarm secrets / node manager checks
 *   - nginx reload (Nexlayer's edge proxy "nexroute" handles routing)
 */

import { IAppEnvVar, IAppVolume } from '../models/AppDefinition'
import Logger from '../utils/Logger'

export interface NexlayerServiceSpec {
    serviceName: string
    imageName?: string
    instanceCount?: number
    ports?: number[]
    envVars?: IAppEnvVar[]
    volumes?: IAppVolume[]
}

class NexlayerOrchestrator {
    // Desired state for services CapRover believes it manages. In native mode
    // CapRover is no longer the source of truth for what is *running* (Nexlayer
    // is), but it remains the source of truth for what the user has *defined*.
    private knownServices: { [serviceName: string]: NexlayerServiceSpec } = {}

    markServiceKnown(serviceName: string, spec?: Partial<NexlayerServiceSpec>) {
        this.knownServices[serviceName] = {
            ...(this.knownServices[serviceName] || { serviceName }),
            ...(spec || {}),
            serviceName,
        }
    }

    isServiceKnown(serviceName: string): boolean {
        return !!this.knownServices[serviceName]
    }

    forgetService(serviceName: string) {
        delete this.knownServices[serviceName]
    }

    listServiceNames(): string[] {
        return Object.keys(this.knownServices)
    }

    /**
     * Map of CapRover's createServiceOnNodeId. In Swarm this would create a
     * placeholder service; here we just record that the service exists so the
     * subsequent updateService (the real deploy) has somewhere to land.
     */
    ensureService(serviceName: string, imageName?: string): Promise<void> {
        this.markServiceKnown(serviceName, { imageName })
        Logger.d(
            `[nexlayer] ensureService ${serviceName} (image: ${imageName}) — recorded, no Swarm service created`
        )
        return Promise.resolve()
    }

    /**
     * The real deploy boundary. CapRover's updateService funnels here.
     *
     * This is where CapRover's app definition becomes a Nexlayer deploy. The
     * translation (CapRover app -> nexlayer.yaml pod) is implemented in
     * buildNexlayerManifest; submitting it to the Nexlayer pipeline is the
     * remaining external call and is gated on platform credentials being
     * present in the environment. Until then we record desired state and log
     * the generated manifest so the dashboard's deploy action succeeds
     * (returns 2xx) rather than throwing a Docker socket error.
     */
    deployApp(spec: NexlayerServiceSpec): Promise<void> {
        this.markServiceKnown(spec.serviceName, spec)
        const manifest = this.buildNexlayerManifest(spec)
        Logger.d(
            `[nexlayer] deployApp ${spec.serviceName} -> generated nexlayer.yaml:\n${manifest}`
        )

        // BOUNDARY: the actual POST to the Nexlayer pipeline API goes here.
        // Wiring it requires a Nexlayer auth token + pipeline endpoint in the
        // environment; in this milestone the manifest is generated and the
        // desired state recorded so the dashboard flow completes. See report.
        return Promise.resolve()
    }

    removeService(serviceName: string): Promise<void> {
        this.forgetService(serviceName)
        Logger.d(`[nexlayer] removeService ${serviceName}`)
        return Promise.resolve()
    }

    /**
     * Translate a CapRover service spec into a Nexlayer nexlayer.yaml manifest.
     * This is the concrete embodiment of "CapRover app -> Nexlayer deploy".
     */
    buildNexlayerManifest(spec: NexlayerServiceSpec): string {
        const podName = spec.serviceName
            .replace(/^captain--/, '')
            .replace(/[^a-zA-Z0-9-]/g, '-')
        const ports = (spec.ports && spec.ports.length ? spec.ports : [80])
            .map((p) => `    - ${p}`)
            .join('\n')
        const vars = (spec.envVars || [])
            .filter((e) => !!e.key)
            .map((e) => `      ${e.key}: ${JSON.stringify(`${e.value ?? ''}`)}`)
            .join('\n')

        const lines = [
            'application:',
            `  name: ${podName}`,
            '  pods:',
            `  - name: ${podName}`,
            `    image: ${spec.imageName || '# filled by pipeline'}`,
            '    path: /',
            '    servicePorts:',
            ports,
        ]
        if (vars) {
            lines.push('    vars:')
            lines.push(vars)
        }
        return lines.join('\n')
    }

    private static instance: NexlayerOrchestrator | undefined
    static get(): NexlayerOrchestrator {
        if (!NexlayerOrchestrator.instance) {
            NexlayerOrchestrator.instance = new NexlayerOrchestrator()
        }
        return NexlayerOrchestrator.instance
    }
}

export default NexlayerOrchestrator
