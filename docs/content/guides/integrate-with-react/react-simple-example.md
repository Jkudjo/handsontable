---
title: 'Basic examples in React'
metaTitle: 'Basic examples in React - Guide - Handsontable Documentation'
permalink: /react-simple-example
canonicalUrl: /react-simple-example
---

# Basic examples in React

[[toc]]

## Overview

The following examples outline how to perform basic tasks using a React Handsontable configuration.

## Examples

::: example #example1 :react --html 1 --js 2
```html
<!-- a root div in which the component is being rendered -->
<div id="example1"></div>
```

```jsx
import ReactDOM from 'react-dom';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import { createSpreadsheetData } from './helpers';

// register Handsontable's modules
registerAllModules();

const hotData = createSpreadsheetData(6, 10);

const App = () => {
  return (
    <div>
      <HotTable
        data={hotData}
        colHeaders={true}
        rowHeaders={true}
        height='auto'
        licenseKey="non-commercial-and-evaluation"
      />
    </div>
  )
}

ReactDOM.render(<App />, document.getElementById('example1'));
```
:::

## A single property configuration

::: example #example2 :react
```jsx
import ReactDOM from 'react-dom';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import { createSpreadsheetData } from './helpers';

// register Handsontable's modules
registerAllModules();

const hotData = createSpreadsheetData(6, 10);

const App = () => {
  return (
    <div>
      <HotTable
        settings={{
          data: hotData,
          colHeaders: true,
          rowHeaders: true,
          height: 'auto',
          licenseKey: 'non-commercial-and-evaluation'
        }}
      />
    </div>
  )
}

ReactDOM.render(<App />, document.getElementById('example2'));
```
:::

## External control

::: example #example3 :react
```jsx
import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import { createSpreadsheetData } from './helpers';

// register Handsontable's modules
registerAllModules();

const App = () => {
  const [settings, setSettings] = useState(() => {
    const initialState = {
      data: createSpreadsheetData(15, 20),
      height: 220,
      licenseKey: 'non-commercial-and-evaluation'
    }

    return initialState;
  });

  const handleChange = (setting, states) => event => {
    setSettings(prevState => ({
      ...prevState,
      [setting]: states[event.target.checked ? 1 : 0],
    }))
  }

  return (
    <div>
      <div className="controllers">
        <label>
          <input onChange={handleChange('fixedRowsTop', [0, 2])} type="checkbox" />
          Add fixed rows
        </label>
        <br/>

        <label>
          <input onChange={handleChange('fixedColumnsStart', [0, 2])} type="checkbox" />
          Add fixed columns
        </label>
        <br/>

        <label>
          <input onChange={handleChange('rowHeaders', [false, true])} type="checkbox" />
          Enable row headers
        </label>
        <br/>

        <label>
          <input onChange={handleChange('colHeaders', [false, true])} type="checkbox" />
          Enable column headers
        </label>
        <br/>
      </div>

      <HotTable root="hot" settings={settings}/>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('example3'));
```
:::
