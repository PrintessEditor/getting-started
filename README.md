![Printess Logo](PrintessLogoS.png)

# Getting Started

This repo shows how easy it is to get started with the printess editor. 

You can see thode code running here:
<https://printesseditor.github.io/getting-started/>

> :warning: **You will be prompted for a password on load. This is only because Printess is not live yet and will be removed with the official release. Please contact the Printess folks to get this password.**

## Prerequisits

Printess has a single npm depencency which you can easily add to your own **package.json**

```JSON
{
  "dependencies": {
    "@webcomponents/webcomponentsjs": "^2.5.0"
  }
}
```
Plus you need to place the **printess-editor** folder in your project root. If you place it somewhere else please adjust the import-path `await import('./printess-editor/printess-editor.js')`; and See below how to adjust the wasmUrl as well. 

Be aware that Printess itself is loaded when all webcomponents polyfills are processed. So first we need to load **webcomponentjs**

```html
  <script src="node_modules/@webcomponents/webcomponentsjs/webcomponents-loader.js" defer></script>
```

Now we wait for **WebComponentsReady** before loading Printess itself. Printess is build on modern js modules. So it need to be imported in a **module** script tag:

```html
<script type="module">
  window.WebComponents = window.WebComponents || {
    waitFor(cb) {
      addEventListener('WebComponentsReady', cb)
    }
  };
  let printess;
  WebComponents.waitFor(async () => {
    printess = await import('./printess-editor/printess-editor.js');
    printess.attachPrintess({
      wasmUrl: "./printess-editor/wasm/printess.wasm",
      div: document.getElementById("printess"),
      domain: "dev-aws.printess.com",
      token: "YOUR TOKEN",
      showBuyerSide: true, 
      templateName: "Sign"
    });
  });
</script>
```
The **attachPrintess** call actually initializes Printess, passed the authentication token and the name of the template you would like to load.

Please be aware that you'll need to tell Printess the path to the WebAssembly file (printess.wasm) in a separate property (**wasmUrl**). Unfortunatly this can not be detected automatically during the **import**. So if your foder structure looks more complex you can always tell Printess to load the proper **wasm**. The **wasmUrl** can also be passed as an absolute Url, like *"https://path.to.wasm/file.wasm"*

In the **div** property you need to pass a div-element which Printess will attach to. 
Printess is intended to have as much space as possible, so it is highly recommended to not leave space on left and right side. Especially on mobile. 

Now the variable named **printess** contains a js-api reference to the Printess editor.  

## Passing Price relevant information from the editor to your shop
Printess has the concept of **Form Fields** which can be created by the designer and changed by the buyer. Those Form Fields can contain information which are price relevant like material or color. The **Sign** template which you see when running *index.html* exposes a couple of such Form Fields. **Material**, **Size** - and if a solid material is selected - **Drill Holes** and **Varnish**. All 4 Form Fields are possibly price relevant so the eCommerce application must know if any of this values has been changed. To achieve this, you can pass a very simple callback to attach printess, where you can adjust your basket settings to the users choices.

```js
  const formFieldChanged = (name, value) => {
    alert( "Form Field: [" + name + "] changed to '" + value + "'");
  }
  printess.attachPrintess({
        /* ... all other properties ... */
        formFieldChangedCallback: formFieldChanged,
  });
```

# Printess Ui or Custom Ui?

There are two ways to add the Printess editor to your website.

In most cases the easy approach of using **Printess Ui** will be the way to go. Just provide a div and let Printess do the heavy lifting. After the buyer has configured its document, you take the JSON and pass it to your shopping basket. And you can pass this JSON back to Printess at any time. As well you are able to tweak the Ui by passing CSS. 

The second option **Custom Ui** reduces Printess to a pure view-container which will ot expose any Ui other then the editable area. All controls and inputs must be provided by your website. This will give you full control on how your website looks like. But you have to handle selection-change and page-change callbacks to update your UI, which in return needs to update Printess properties via the js-api.

In the getting-started application you can toggle between both implementations whereby the **Custom Ui** is just a very basic exmaple of what is possible. No styling has been applied to keep to code easy to read. 



