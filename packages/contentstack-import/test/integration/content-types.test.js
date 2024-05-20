const fs = require('fs');
const { promises: fsPromises } = fs;
const path = require('path');
const { expect, test } = require('@oclif/test');
const { test: customTest } = require('cs-cli-1-dev-dependencies');
const { messageHandler } = require('cs-cli-1-utilities');
const LoginCommand = require('cs-cli-1-auth/lib/commands/auth/login').default;
const AddTokenCommand = require('cs-cli-1-auth/lib/commands/auth/tokens/add').default;
const RegionSetCommand = require('cs-cli-1-config/lib/commands/config/set/region').default;
const ExportCommand = require('cs-cli-1-cm-export/src/commands/cm/stacks/export');

const { default: defaultConfig } = require('../../src/config');
const modules = defaultConfig.modules;
const { getStackDetailsByRegion, cleanUp, deleteStack, getEnvData, getContentTypesCount } = require('./utils/helper');
const { PRINT_LOGS, IMPORT_PATH } = require('./config.json');
const { DELIMITER, KEY_VAL_DELIMITER } = process.env;
const { ENCRYPTION_KEY } = getEnvData();

const REGION_MAP = {
  NA: 'NA',
  NA_AZ: 'AZURE-NA',
  EU_AZ: 'AZURE-EU',
  EU: 'EU',
};

module.exports = (region) => {
  const stackDetails = getStackDetailsByRegion(region.REGION, DELIMITER, KEY_VAL_DELIMITER);
  for (const stack of Object.keys(stackDetails)) {
    const basePath = path.join(__dirname, '..', '..', `${IMPORT_PATH}_${stack}`);
    const importBasePath = path.join(basePath, stackDetails[stack].BRANCH ? stackDetails[stack].BRANCH : 'main');
    const contentTypesBasePath = path.join(importBasePath, modules.content_types.dirName);
    const messageFilePath = path.join(__dirname, '..', '..', 'messages/index.json');
    messageHandler.init({ messageFilePath });
    const username = ENCRYPTION_KEY ? crypto.decrypt(region.USERNAME) : region.USERNAME;
    const password = ENCRYPTION_KEY ? crypto.decrypt(region.PASSWORD) : region.PASSWORD;

    describe('Contentstack-import plugin test [--module=content-types]', () => {
      customTest
        .stdout({ print: PRINT_LOGS || false })
        .command(RegionSetCommand, [REGION_MAP[stackDetails[stack].REGION_NAME]])
        .command(LoginCommand, [`-u=${username}`, `-p=${password}`])
        .it('should work without any errors', (_, done) => {
          done();
        });

      customTest
        .command(AddTokenCommand, [
          '-a',
          stackDetails[stack].EXPORT_ALIAS_NAME,
          '-k',
          stackDetails[stack].EXPORT_STACK_API_KEY,
          '--management',
          '--token',
          stackDetails[stack].EXPORT_MANAGEMENT_TOKEN,
          '-y',
        ])
        .it(`Adding token for ${stack}`, (_, done) => {
          done();
        });

      customTest
        .command(AddTokenCommand, [
          '-a',
          stackDetails[stack].ALIAS_NAME,
          '-k',
          stackDetails[stack].STACK_API_KEY,
          '--management',
          '--token',
          stackDetails[stack].MANAGEMENT_TOKEN,
          '-y',
        ])
        .it(`Adding token for ${stack}`, (_, done) => {
          done();
        });

      customTest
        .stdout({ print: PRINT_LOGS || false })
        .command(ExportCommand, [
          '--alias',
          stackDetails[stack].EXPORT_ALIAS_NAME,
          '--data-dir',
          basePath,
          '--module',
          'content-types',
        ])
        .it('should work without any errors', (_, done) => {
          done();
        });

      describe('Import assets using cm:stacks:import command', () => {
        test
          .stdout({ print: PRINT_LOGS || false })
          .command([
            'cm:stacks:import',
            '--alias',
            stackDetails[stack].ALIAS_NAME,
            '--data-dir',
            importBasePath,
            '--module',
            'content-types',
          ])
          .it('should work without any errors', async (_, done) => {
            let importedContentTypesCount = 0;
            const contentTypesCount = await getContentTypesCount(stackDetails[stack]);
            try {
              if (fs.existsSync(contentTypesBasePath)) {
                let contentTypes = await fsPromises.readdir(contentTypesBasePath);
                importedContentTypesCount = contentTypes.filter((ct) => !ct.includes('schema.json')).length;
              }
            } catch (error) {
              console.trace(error);
            }

            expect(contentTypesCount).to.be.an('number').eq(importedContentTypesCount);
            done();
          });
      });

      after(async () => {
        await cleanUp(path.join(__dirname, '..', '..', `${IMPORT_PATH}_${stack}`));
        // await deleteStack({ apiKey: stackDetails[stack].STACK_API_KEY, authToken: configHandler.get('authtoken') });
        defaultConfig.management_token = null;
        defaultConfig.branch = null;
        defaultConfig.branches = [];
        defaultConfig.moduleName = null;
      });
    });
  }
};
