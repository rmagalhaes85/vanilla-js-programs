class TestSuite {
  tests = [];
  suiteDescription = '';

  constructor(suiteDescription) {
    this.suiteDescription = suiteDescription;
  }

  addTest(testObj) {
    if (typeof testObj.testFn !== 'function') {
      throw new Error('`testFn` must be defined and be a function');
    }
    if (typeof testObj.description !== 'string') {
      throw new Error('`description` must be defined and be a string');
    }
    this.tests.push(testObj);
  }

  runTests() {
    if (this.tests.length === 0) {
      console.log('No tests to run');
      return;
    }
    let someFailedTest = false;
    let testsOutputs = [];
    // collect tests' outputs. We store the results to be printed only later, since we
    // want to show the suite collapsed in developer tools in case all the tests
    // succeed
    for (const {testFn, description} of this.tests) {
      let testResult = 'NOT RUN';
      let testResultColor = 'black';
      try {
        const testSuceeded = testFn();
        someFailedTest |= !testSuceeded;
        testResult = !!testSuceeded ? 'SUCCESS' : 'FAIL';
        testResultColor = !!testSuceeded ? 'green' : 'red';
      } catch(e) {
        console.error(`Error running the following test: ${description}`, e);
        someFailedTest |= true;
        testResult = 'ERROR';
        testResultColor = 'red';
      }
      testsOutputs.push({
        message: `%c${testResult}: ${description}`,
        style: `color: ${testResultColor}`,
      });
    }
    // print suite's output
    console[someFailedTest ? 'group' : 'groupCollapsed'](this.suiteDescription);
    for (const result of testsOutputs) {
      console.log(`${result.message}`, `${result.style}`);
    }
    console.groupEnd();
  }
}


