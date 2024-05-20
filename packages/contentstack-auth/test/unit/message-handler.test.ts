import { expect } from 'chai';
import { messageHandler } from 'cs-cli-1-utilities';

describe('Message Handler', () => {
  it('parse with invalid message key, returns the key itself', function () {
    const result = messageHandler.parse('CLI_LOGIN_ENTER_EMAIL_ADDRESS');
    expect(result).to.be.equal('CLI_LOGIN_ENTER_EMAIL_ADDRESS');
  });
});
