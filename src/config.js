'use strict';

const readFile = require('fs').readFileSync;
const writeFile = require('fs').writeFileSync;
const pathJoin = require('path').join;
const defaults = require('lodash/defaultsDeep');
const DEFAULT_OPTIONS = require('./default-options');
const inputWithConfirmation = require('./utils/inquires').inputWithConfirmation;
const input = require('./utils/inquires').input;
const confirm = require('./utils/inquires').confirm;
const validationConfigurators = require('./validations').configurators;
const reporter = require('./reporters/current');

const optionsConfigurators = {
    prePublishScript: (currentVal) =>
        inputWithConfirmation(
            'Do you want to run any scripts before publishing (e.g. build steps, tests)?',
            false,
            'Input pre-publish script',
            currentVal
        ),

    postPublishScript: (currentVal) =>
        inputWithConfirmation(
            'Do you want to run any scripts after succesful publishing (e.g. release announcements, binary uploading)?',
            false,
            'Input post-publish script',
            currentVal
        ),

    publishCommand: (currentVal) =>
        input(
            'Specify publishing command which will be used to publish your package',
            currentVal
        ),

    publishTag: (currentVal) =>
        input(
            'Specify release tag with which you package will be published',
            currentVal
        ),

    confirm: (currentVal) =>
        confirm('Do you want manually confirm publishing?', currentVal),
};

function configureOptsObject(obj, configurators, optType) {
    return Object.keys(configurators).reduce((chain, prop) => {
        return chain
            .then(() => {
                reporter
                    .current()
                    .reportStep(`-- Configuring ${optType} "${prop}":`);
                return configurators[prop](obj[prop]);
            })
            .then((val) => {
                obj[prop] = val;
            });
    }, Promise.resolve());
}

function configure(opts) {
    return configureOptsObject(opts, optionsConfigurators, 'option')
        .then(() =>
            configureOptsObject(
                opts.validations,
                validationConfigurators,
                'validation'
            )
        )
        .then(() => {
            reporter.current().reportInformation('-- Current configuration:');
            reporter.current().reportAsIs(JSON.stringify(opts, null, 2));
            reporter.current().reportAsIs('');
            reporter.current().reportAsIs('');
            return confirm('Is this OK?', true);
        })
        .then((yes) => !yes && configure(opts));
}

function configureAndSave(opts, rcFile) {
    return configure(opts)
        .then(() => writeFile(rcFile, JSON.stringify(opts, null, 2)))
        .then(() =>
            reporter
                .current()
                .reportSuccess('Configuration has been successfully saved.')
        )
        .catch((err) => {
            reporter.current().reportError('ERROR');
            reporter.current().reportAsIs(err.stack);
        });
}

function getCurrentOpts(projectDir) {
    const rcFile = pathJoin(projectDir || process.cwd(), '.publishrc');
    let optsFromFile = null;
    try {
        optsFromFile = JSON.parse(readFile(rcFile).toString());
    } catch (err) {
        optsFromFile = {};
    }
    return defaults({}, optsFromFile, DEFAULT_OPTIONS);
}

module.exports = {
    getCurrentOpts,
    configurePublishPlease: {
        with: (opts) => {
            return {
                inProject: (projectDir) => {
                    const rcFile = pathJoin(
                        projectDir || process.cwd(),
                        '.publishrc'
                    );
                    return configureAndSave(opts, rcFile);
                },
            };
        },
        inCurrentProject: () => {
            const projectDir = process.cwd();
            const opts = getCurrentOpts(projectDir);
            const rcFile = pathJoin(projectDir, '.publishrc');
            return configureAndSave(opts, rcFile);
        },
    },
};
