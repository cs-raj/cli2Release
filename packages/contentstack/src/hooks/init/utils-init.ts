import { messageHandler, cliux, managementSDKInitiator, marketplaceSDKInitiator } from 'cs-cli-1-utilities';

/**
 * Initialize the utilities 
 */
export default function (_opts): void {
  const { context } = this.config;
  messageHandler.init(context);
  cliux.init(context);
  managementSDKInitiator.init(context);
  marketplaceSDKInitiator.init(context);
}
