# jira-todo
[![npm](https://img.shields.io/npm/v/jira-todo.svg?style=flat-square)](https://www.npmjs.com/package/jira-todo)
[![Coveralls](https://img.shields.io/coveralls/pigulla/jira-todo.svg?style=flat-square)]()
[![Codeship](https://img.shields.io/codeship/b975c890-eac8-0133-c44b-7a726143f84a.svg?style=flat-square)]()
[![Dependency Status](https://img.shields.io/david/pigulla/jira-todo.svg?style=flat-square)](https://david-dm.org/pigulla/jira-todo)
[![devDependency Status](https://img.shields.io/david/dev/pigulla/jira-todo.svg?style=flat-square)](https://david-dm.org/pigulla/jira-todo)
[![License](https://img.shields.io/npm/l/jira-todo.svg?style=flat-square)](https://github.com/pigulla/jira-todo/blob/master/LICENSE)

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
