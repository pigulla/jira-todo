'use strict';

/* eslint-disable quotes, max-len */

module.exports = function makeResponse(key, options) {
    return {
        "expand": "renderedFields,names,schema,operations,editmeta,changelog,versionedRepresentations",
        "id": "36713",
        "self": "https://jira.host.invalid/rest/api/2/issue/4711",
        "key": key,
        "fields": {
            "issuetype": {
                "self": `https://jira.host.invalid/rest/api/2/issuetype/${options.typeId}`,
                "id": options.typeId,
                "description": "A task that needs to be done.",
                "iconUrl": "https://jira.host.invalid/secure/viewavatar?size=xsmall&avatarId=10411&avatarType=issuetype",
                "name": options.typeName,
                "subtask": false,
                "avatarId": 10411
            },
            "status": {
                "self": `https://jira.host.invalid/rest/api/2/status/${options.statusId}`,
                "description": "A resolution has been taken, and it is awaiting verification by reporter. From here issues are either reopened, or are closed.",
                "iconUrl": "https://jira.host.invalid/images/icons/statuses/resolved.png",
                "name": options.statusName,
                "id": options.statusId,
                "statusCategory": {
                    "self": "https://jira.host.invalid/rest/api/2/statuscategory/3",
                    "id": 3,
                    "key": "done",
                    "colorName": "green",
                    "name": "Done"
                }
            }
        }
    };
};