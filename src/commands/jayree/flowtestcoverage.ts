import { core, SfdxCommand } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';

core.Messages.importMessagesDirectory(__dirname);

const messages = core.Messages.loadMessages('sfdx-jayree', 'flowtestcoverage');

export default class FlowTestCoverage extends SfdxCommand {
  public static description = messages.getMessage('commandDescription');

  public static examples = [
    `$ sfdx jayree:flowtestcoverage
=== Flow Test Coverage
Coverage: 82%
...
`
  ];

  protected static requiresUsername = true;
  protected static supportsDevhubUsername = false;
  protected static requiresProject = false;

  public async run(): Promise<AnyJson> {
    await this.org.refreshAuth();
    const conn = this.org.getConnection();

    const query1 = await conn.tooling.query(
      "SELECT count_distinct(DefinitionId) FROM Flow WHERE Status = 'Active' AND(ProcessType = 'AutolaunchedFlow' OR ProcessType = 'Workflow' OR ProcessType = 'CustomEvent' OR ProcessType = 'InvocableProcess')"
    );

    const numberOfActiveAutolaunchedFlowsAndProcesses = query1.records[0]['expr0'];

    const query2 = await conn.tooling.query('SELECT count_distinct(FlowVersionId) FROM FlowTestCoverage');

    const numberOfCoveredActiveAutolaunchedFlowsAndProcesses = query2.records[0]['expr0'];

    const query3 = await conn.tooling.query(
      "SELECT Definition.DeveloperName FROM Flow WHERE Status = 'Active' AND(ProcessType = 'AutolaunchedFlow' OR ProcessType = 'Workflow' OR ProcessType = 'CustomEvent' OR ProcessType = 'InvocableProcess') AND Id NOT IN(SELECT FlowVersionId FROM FlowTestCoverage)"
    );
    const uncovered = query3.records.map(value => value['Definition']['DeveloperName']);

    const query4 = await conn.tooling.query(
      'SELECT FlowVersion.Definition.DeveloperName FROM FlowTestCoverage GROUP BY FlowVersion.Definition.DeveloperName'
    );
    const covered = query4.records.map(value => value['DeveloperName']);

    this.ux.styledHeader('Flow Test Coverage');
    this.ux.styledObject({
      'number of active autolaunched flows and processes': numberOfActiveAutolaunchedFlowsAndProcesses,
      'number of covered active autolaunched flows and processes': numberOfCoveredActiveAutolaunchedFlowsAndProcesses,
      Coverage:
        Math.floor(
          (numberOfCoveredActiveAutolaunchedFlowsAndProcesses / numberOfActiveAutolaunchedFlowsAndProcesses) * 100
        ) + '%'
    });

    const x = [];
    const length = uncovered.length > covered.length ? uncovered.length : covered.length;
    for (let i = 0; i < length; i++) {
      x.push({
        'all active autolaunched flows and processes that don’t have test coverage': uncovered[i],
        'all flows and processes that have test coverage': covered[i]
      });
    }

    this.ux.table(x, {
      columns: [
        {
          key: 'all flows and processes that have test coverage'
        },
        {
          key: 'all active autolaunched flows and processes that don’t have test coverage'
        }
      ]
    });

    if (covered.length !== numberOfCoveredActiveAutolaunchedFlowsAndProcesses) {
      this.ux.warn(
        'Error in the FlowTestCoverage table found, please delete all records in the FlowTestCoverage table, then run all tests, and use this command to check the Flow Test Coverage again'
      );
    }

    return {
      orgId: this.org.getOrgId(),
      Coverage:
        Math.floor(
          (numberOfCoveredActiveAutolaunchedFlowsAndProcesses / numberOfActiveAutolaunchedFlowsAndProcesses) * 100
        ) + '%',
      numberOfActiveAutolaunchedFlowsAndProcesses,
      numberOfCoveredActiveAutolaunchedFlowsAndProcesses,
      'all active autolaunched flows and processes that don’t have test coverage': uncovered,
      'all flows and processes that have test coverage': covered
    };
  }
}
