'use strict';
/**
 * Why there is no import of third-party modules at the root of this file?
 * Required modules may not be available at some point
 * of the publish-please module lifecycle.
 * Requiring those modules at first will break the publish-please execution
 * because reporter's code will be the first to execute
 */
const os = require('os');

/**
 * CI reporter.
 * @module reporters/ci-reporter
 */
module.exports = {
    /**
     * name of the reporter. Must be unique among all reporters.
     */
    name: 'ci',
    /**
     * Check if this reporter can be used.
     * @returns {boolean} returns true if this reporter can be used.
     * false otherwise
     */
    canRun() {
        return true;
    },
    /**
     * Check if this reporter should be used
     * @returns {boolean} returns true if this reporter should be used
     * To make this reporter the default one, this method must return true unconditionnaly
     */
    shouldRun() {
        const getNpmArgs = require('../utils/get-npm-args');
        const getNpxArgs = require('../utils/get-npx-args');
        const npmArgs = getNpmArgs(process.env);
        const npxArgs = getNpxArgs(process);
        if (npmArgs && npmArgs['--ci']) {
            return true;
        }
        if (npxArgs && npxArgs['--ci']) {
            return true;
        }
        return false;
    },
    reportAsIs,
    reportError,
    reportInformation,
    reportRunningSequence,
    reportRunningTask,
    reportStep,
    reportSucceededSequence,
    reportSuccess,
};

/**
 * report error message
 * @param {string} message - error message to be reported
 */
function reportError(message) {
    console.log(message);
}

/**
 * report a task that is executing and may take some time
 * @param {string} taskname
 * @returns {function(boolean): void} done - returns a function to be called when task has finished processing
 * done(true) -> report success
 * done(false) -> report failure
 */
function reportRunningTask(taskname) {
    const platform = os.platform();
    function done(success) {
        if (success) {
            console.log(
                `${platform.startsWith('win') ? '√' : '✓'} ${taskname}`
            );
            return;
        }
        console.log(`${platform.startsWith('win') ? '×' : '✖'} ${taskname}`);
    }

    return done;
}

/**
 * report success message
 * @param {string} message - success message to be reported
 */
function reportSuccess(message) {
    console.log(message);
}

/**
 * report information message
 * @param {string} message - information message to be reported
 */
function reportInformation(message) {
    console.log(message);
}

/**
 * report step message
 * @param {string} message - step message to be reported
 */
function reportStep(message) {
    console.log(message);
}

/**
 * report message without doing any extra formatting
 * @param {string} message - message to be reported
 */
function reportAsIs(message) {
    console.log(message);
}

/**
 * report a new running sequence
 * A running sequence is composed of one or more steps
 * Each step in a sequence may be reported by:
 *      reportStep if the step is synchronous
 *      reportRunningTask if the step is asynchronous
 * @param {string} message - name of the sequence to be reported
 */
function reportRunningSequence(message) {
    console.log(message);
    console.log('-------------------------');
}

/**
 * report a successful execution of a sequence
 * A running sequence is composed of one or more steps
 * Each step in a sequence may be reported by:
 *      reportStep if the step is synchronous
 *      reportRunningTask if the step is asynchronous
 * @param {string} message - name of the sequence to be reported
 */
function reportSucceededSequence(message) {
    console.log('-------------------');
    console.log(message);
    console.log('');
}
