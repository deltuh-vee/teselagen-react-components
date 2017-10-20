# TeselaGen-React-Components

Demo: http://reactcomponents.teselagen.com/


[![CircleCI](https://circleci.com/gh/TeselaGen/teselagen-react-components/tree/master.svg?style=shield)](https://circleci.com/gh/TeselaGen/teselagen-react-components/tree/master)
[![npm package][npm-badge]][npm]
[![codecov](https://codecov.io/gh/TeselaGen/teselagen-react-components/branch/master/graph/badge.svg)](https://codecov.io/gh/TeselaGen/teselagen-react-components)


<!-- TOC -->

- [TeselaGen-React-Components](#teselagen-react-components)
- [Using:](#using)
  - [Enhancers:](#enhancers)
    - [withDelete, withUpsert, withQuery](#withdelete-withupsert-withquery)
  - [getApolloMethods (query, upsert, delete)](#getapollomethods-query-upsert-delete)
    - [query](#query)
    - [upsert](#upsert)
    - [delete](#delete)
  - [Data Table](#data-table)
- [Development:](#development)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Demo Development Server](#demo-development-server)
  - [Developing linked to another folder: aka lims/hde](#developing-linked-to-another-folder-aka-limshde)
  - [Running Tests](#running-tests)
  - [Releasing](#releasing)
  - [Adding custom svg icons](#adding-custom-svg-icons)

<!-- /TOC -->

# Using: 
```
yarn add teselagen-react-components
```
Add peer-dependencies: 
```
yarn add @blueprintjs/core @blueprintjs/datetime @blueprintjs/table react-addons-css-transition-group react-redux react-select redux 
```

## Enhancers:
### withDelete, withUpsert, withQuery
```js
import {withDelete, withUpsert, withQuery} from "teselagen-react-components";
import jobWorkflowRunsQuery from '../graphql/queries/jobWorkflowRunsQuery';
import workQueueItemFragment from '../graphql/fragments/workQueueItemFragment';

export default compose(
	//withUpsert takes a fragment/string as its first argument and an options object as its second param.
	//in the case below it will pass a prop to the wrapped component called upsertWorkQueueItem
	//upsertWorkQueueItem() can be passed an array or single object and will perform a create or an update based on 
	//if it detects an id
  withUpsert(workQueueItemFragment,
		{extraMutateArgs: {
			refetchQueries: [ { query: jobWorkflowRunsQuery } ]
			//any additional options are spread onto the usual apollo mutation enhancer 
	}}),
	//withDelete takes a fragment/string as its first argument and an options object as its second param.
	//in the case below it will pass a prop to the wrapped component called deleteWorkQueueItem
	//deleteWorkQueueItem() can be passed an array of ids or a single id and will delete those items with the given id
  withDelete(workQueueItemFragment, { 
    mutationName: "deleteWorkQueueItems",
		//any additional options are spread onto the usual apollo mutation enhancer 
  })
	//withQuery takes only a fragment as its first argument and an options object as its second param.
	//in the case below it will pass several props to the wrapped component: 
	//data  --- the usual apollo query data object 
	//workQueueItemsQuery  ---  the usual apollo query data object just on a unique name
	//workQueueItem/s  --- the actual workQueueItem record or the workQueueItems records array  
	//workQueueItemsCount --- the count of the records coming back if isPlural:true
	withQuery(workQueueItemFragment, {
		//isPlural: boolean whether or not to search for just one item or multiple
    //any additional options are spread onto the usual apollo query enhancer 
		options: props => {
      const id = parseInt(get(props, "match.params.id"), 10);
      return {
        variables: {
          id
        }
      };
    }
  }),
)(AddToWorkQueueDialog);
```

## getApolloMethods (query, upsert, delete)
```js
//pass an apollo client here:
const {upsert, query, delete} = getApolloMethods(client);
```

### query
```js
const resultArray = await query(fragment, options)
//examples: 
const aliquot = await query(aliquotFragment, {variables: {id: 2}})
const aliquots = await query(aliquotFragment, {isPlural: true, variables: {filter: {name: 'aliquotX'}}})
```
### upsert
```js
const resultArray = await upsert(modelNameOrFragment [, options], modelOrModels)
//examples: 
const [aliquot] = await upsert('aliquot', {name: 'aliquot1'})
const aliquots = await upsert('aliquot', [{name: 'aliquot1'}, {name: 'aliquot2'}])
```
### delete
```js
await delete(modelNameOrFragment, [, options], modelOrModels)
//examples: 
await delete('aliquot', 1)
await delete('aliquot', [1,2,6,1616])
```


## Data Table
```js
import {DataTable, routeDoubleClick, queryParams} from "teselagen-react-components";
import {toastr} from 'teselagen-react-components';
import {
	InputField,
	SelectField,
	DateInputField,
	CheckboxField,
	TextareaField,
	EditableTextField,
	ReactSelectField,
	NumericInputField,
	RadioGroupField,
	FileUploadField
} from 'teselagen-react-components'

<InputField
  name={"fieldName"}
  label="fieldLabel"
  placeholder="Enter text..."
  inputClassName="className(s) for input"
/>

```
# Development: 
## Prerequisites

[Node.js](http://nodejs.org/) >= v4 must be installed.

## Installation

- Running `npm install` in the components's root directory will install everything you need for development.

## Demo Development Server

- `npm start` will run a development server with the component's demo app at [http://localhost:3000](http://localhost:3000) with hot module reloading. You can check the /demo folder for the source code.

## Developing linked to another folder: aka lims/hde
```
//link everything up:
cd lims/node_modules/react
yarn link 
cd teselagen-react-components
yarn link
yarn link react
cd lims
yarn link teselagen-react-components

//start the auto rebuild:
cd teselagen-react-components
yarn build-watch
```

## Running Tests

- `npm test` will run the tests once.

- `npm run test:coverage` will run the tests and produce a coverage report in `coverage/`.

- `npm run test:watch` will run the tests on every change.

## Releasing

- `npm whoami` you should be teselagen
- `npm login` 
teselagen//ourMasterPass//team@teselagen.com
- git pull
- npm version patch|minor|major
- npm publish
- git push


## Adding custom svg icons
 - `yarn fontopen` this opens up our custom font file in the fontello webtool
 - add the svg icons you want, hit **Save Session** to commit your changes
 - then run `yarn fontsave`
 - commit the changes :)