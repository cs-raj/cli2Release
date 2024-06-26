const path = require('path');
const { messageHandler } = require('cs-cli-1-utilities');

process.env.TS_NODE_PROJECT = path.resolve('test/tsconfig.json');
process.env.CLI_ENV = 'TEST';

// NOTE init messageHandler
const messageFilePath = path.join(__dirname, '..', '..', 'messages/index.json');
messageHandler.init({ messageFilePath });
