# jira-todo
[![npm version](https://badge.fury.io/js/jira-todo.svg)](https://badge.fury.io/js/jira-todo)
[![Coverage Status](https://coveralls.io/repos/github/pigulla/jira-todo/badge.svg?branch=master)](https://coveralls.io/github/pigulla/jira-todo?branch=master)
[![Codeship Status for pigulla/jira-todo](https://www.codeship.io/projects/b975c890-eac8-0133-c44b-7a726143f84a/status?branch=master)](https://www.codeship.io/projects/148002)
[![Dependency Status](https://david-dm.org/pigulla/jira-todo.svg)](https://david-dm.org/pigulla/jira-todo)
[![devDependency Status](https://david-dm.org/pigulla/jira-todo/dev-status.svg)](https://david-dm.org/pigulla/jira-todo#info=devDependencies)

> Check your source code for todos and the Jira issues referenced by them.

## The What
jira-todo analyzes your JavaScript files and looks for comments that contain todo annotations as defined by certain keywords (by default those are `todo` and `fixme`).

For example, consider the following source code:
```js
function fibonacci(n) {
    // TODO FIB-42: Consider negative values for n
    if (n === 1 || n === 2) {
        return 1;
    } else {
        return fibonacci(n - 1) + fibonacci(n - 2);
    }
}
```
jira-todo will be triggered by the keyword `TODO` and identify the referenced Jira issue `FIB-42`. In a second step it will contact the Jira server, retrieve the data for that  issue and validate whether its type and status are acceptable.

## The Why
In most projects the code is riddled with TODOs and FIXMEs, but experience shows that those are oftentimes not resolved unless there is a ticket in your issue tracker that forces you to (sooner or later).

But even if you connect your todos with specific issues the two can still run out of sync or you might reference issues that are already closed. jira-todo helps you enforce consistency between your source code and Jira issues.

## Configuration

Check out the documentation in the [wiki](../../wiki/Configuration).