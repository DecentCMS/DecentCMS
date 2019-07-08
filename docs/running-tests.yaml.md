title: Running tests
number: 3

-8<------------------------------------------------------------------

In Decent CMS, every module comes with its own tests.
It is possible to run tests either on a specific module, or for all of them at once.

## Prerequisites

All built-in modules use the [Mocha test framework](https://mochajs.org/).
In order to run tests, you should have Mocha installed globally:

```bash
npm install -g mocha
```

## Running tests for a single module or theme from the command-line

To execute tests on a single module or theme, simply `cd` to its directory
(the one that has the `package.json` file), and run `npm test` command.

## Running tests on all modules and themes from the command-line

To run all tests from all modules and themes, `cd` to the root of your Decent CMS
install, and run the `npm test` command.

## Running tests from VS Code

Decent CMS is built using [VS Code](https://code.visualstudio.com/) as the code editor of choice.
It is possible to run tests using the [Mocha sidebar](https://marketplace.visualstudio.com/items?itemName=maty.vscode-mocha-sidebar),
which will automatically discover all the tests for all modules and themes.

The Mocha sidebar extension also makes it very easy to debug into test code.
