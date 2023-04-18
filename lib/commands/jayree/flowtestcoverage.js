/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SfCommand, requiredOrgFlagWithDeprecations, orgApiVersionFlagWithDeprecations, } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
// eslint-disable-next-line no-underscore-dangle
const __filename = fileURLToPath(import.meta.url);
// eslint-disable-next-line no-underscore-dangle
const __dirname = dirname(__filename);
Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('sfdx-jayree', 'flowtestcoverage');
class FlowTestCoverage extends SfCommand {
    async run() {
        const { flags } = await this.parse(FlowTestCoverage);
        const org = flags['target-org'];
        const conn = org.getConnection(flags['api-version']);
        const query1 = await conn.tooling.query("SELECT count_distinct(DefinitionId) FROM Flow WHERE Status = 'Active' AND(ProcessType = 'AutolaunchedFlow' OR ProcessType = 'Workflow' OR ProcessType = 'CustomEvent' OR ProcessType = 'InvocableProcess')");
        const numberOfActiveAutolaunchedFlowsAndProcesses = query1.records[0]['expr0'];
        const query2 = await conn.tooling.query('SELECT count_distinct(FlowVersionId) FROM FlowTestCoverage');
        const numberOfCoveredActiveAutolaunchedFlowsAndProcesses = query2.records[0]['expr0'];
        const query3 = await conn.tooling.query("SELECT Definition.DeveloperName FROM Flow WHERE Status = 'Active' AND(ProcessType = 'AutolaunchedFlow' OR ProcessType = 'Workflow' OR ProcessType = 'CustomEvent' OR ProcessType = 'InvocableProcess') AND Id NOT IN(SELECT FlowVersionId FROM FlowTestCoverage)");
        const uncovered = query3.records.map((value) => value['Definition']['DeveloperName']);
        const query4 = await conn.tooling.query('SELECT FlowVersion.Definition.DeveloperName FROM FlowTestCoverage GROUP BY FlowVersion.Definition.DeveloperName');
        const covered = query4.records.map((value) => value['DeveloperName']);
        this.styledHeader('Flow Test Coverage');
        this.styledObject({
            'number of active autolaunched flows and processes': numberOfActiveAutolaunchedFlowsAndProcesses,
            'number of covered active autolaunched flows and processes': numberOfCoveredActiveAutolaunchedFlowsAndProcesses,
            Coverage: Math.floor((numberOfCoveredActiveAutolaunchedFlowsAndProcesses / numberOfActiveAutolaunchedFlowsAndProcesses) * 100) + '%',
        });
        const x = [];
        const length = uncovered.length > covered.length ? uncovered.length : covered.length;
        for (let i = 0; i < length; i++) {
            x.push({
                'all active autolaunched flows and processes that don’t have test coverage': uncovered[i],
                'all flows and processes that have test coverage': covered[i],
            });
        }
        this.table(x, {
            TESTCOVERAGE: {
                header: 'all flows and processes that have test coverage',
                get: (row) => row['all flows and processes that have test coverage'],
            },
            NOTESTCOVERAGE: {
                header: 'all active autolaunched flows and processes that don’t have test coverage',
                get: (row) => row['all active autolaunched flows and processes that don’t have test coverage'],
            },
        });
        if (covered.length !== numberOfCoveredActiveAutolaunchedFlowsAndProcesses) {
            this.warn('Error in the FlowTestCoverage table found, please delete all records in the FlowTestCoverage table, then run all tests, and use this command to check the Flow Test Coverage again');
        }
        return {
            orgId: org.getOrgId(),
            Coverage: Math.floor((numberOfCoveredActiveAutolaunchedFlowsAndProcesses / numberOfActiveAutolaunchedFlowsAndProcesses) * 100) + '%',
            numberOfActiveAutolaunchedFlowsAndProcesses,
            numberOfCoveredActiveAutolaunchedFlowsAndProcesses,
            'all active autolaunched flows and processes that don’t have test coverage': uncovered,
            'all flows and processes that have test coverage': covered,
        };
    }
}
FlowTestCoverage.summary = messages.getMessage('commandDescription');
FlowTestCoverage.examples = [
    `$ sfdx jayree:flowtestcoverage
=== Flow Test Coverage
Coverage: 82%
...
`,
];
FlowTestCoverage.flags = {
    'target-org': requiredOrgFlagWithDeprecations,
    'api-version': orgApiVersionFlagWithDeprecations,
};
export default FlowTestCoverage;
//# sourceMappingURL=flowtestcoverage.js.map