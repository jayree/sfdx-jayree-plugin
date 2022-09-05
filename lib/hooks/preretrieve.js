import { env } from '@salesforce/kit';
import Debug from 'debug';
import { runHooks } from '../utils/hookUtils.js';
const debug = Debug('jayree:hooks');
// eslint-disable-next-line @typescript-eslint/require-await
export const preretrieve = async function (options) {
    debug(`called 'jayree:preretrieve' by: ${options.Command.id}`);
    if (!runHooks) {
        debug('hooks disabled');
        return;
    }
    env.setBoolean('SFDX_DISABLE_PRETTIER', true);
    debug('set: SFDX_DISABLE_PRETTIER=true');
};
//# sourceMappingURL=preretrieve.js.map