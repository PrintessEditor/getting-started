![Printess Logo](PrintessLogoS.png)

# Getting Started

This repo shows how easy it is to get started with the printess editor.

You can see thode code running here:
<https://printesseditor.github.io/getting-started/>

To get started with Printess in React, follow the link below:
<https://github.com/PrintessEditor/getting-started-react>

## &nbsp;

# Embedding the Printess Editor

Printess can easily be loaded from our CDN.

Be aware that Printess itself is loaded after the webcomponents polyfills. So first we need to load **webcomponentjs** from the Printess CDN.

```html
<script src="https://editor.printess.com/node_modules/@webcomponents/webcomponentsjs/webcomponents-loader.js"></script>
```

Now we wait for **WebComponentsReady** before loading Printess itself.

```html
<script>
  window.WebComponents = window.WebComponents || {
    waitFor(cb) {
      addEventListener('WebComponentsReady', cb);
    },
  };
  let printess;
  let api;
  WebComponents.waitFor(async () => {
    printess = await import(
      'https://editor.printess.com/printess-editor/printess-editor.js'
    );

    api = printess.attachPrintess({
      resourcePath: 'https://editor.printess.com/printess-editor', // needs to be always set
      domain: 'api.printess.com',
      div: document.getElementById('printess'),
      basketId: 'CurrentShopBasketId',
      shopUserId: 'CurrentShopCustomerId',
      token: 'YOUR TOKEN',
      showBuyerSide: true,
      templateName: 'Sign',
    });
  });
</script>
```

The `attachPrintess` call initializes Printess, passes the authentication token and the name of the template to be loaded.

Please be aware that you'll need to tell Printess the path to its resource files (Web-Assembly and Default Fonts) in a separate property `resourcePath`. Please do not change this value.

The `domain` should remain unchanged. It only needs to be changed if you are uing a private Printess cloud.

In the `div` property you need to pass a div-element which Printess Editor will attach to.
Printess is intended to have as much space as possible, so it is highly recommended to not leave space on left and right side. Especially on mobile.

`token` should be set to a **Shop-Token** which points to yout Printess Account. You can get this token once you are logged in in the Printess Editor -> Account Menu -> API-Token. You'll see 3 different tokens in the dialog. Please always use the **Shop-Token**.

Finally the variable named `printess` contains a **js-api** reference to the Printess editor.

If you use typescript you'll find a `printess-editor.d.ts` file in the repro which contains all types for the printess object.

## &nbsp;

## `basketId` and `shopUserId`

To enable your customer to upload images and to save or load the state of work - you need to pass in minimum a `BasketId` to printess on `attachPrintess()`.

Optionally you can pass a `shopUserId` to make Printess store in the context of the current customer (user). Also when the customer uploads an image it will be stored under the `shopUserId`. So if the customer returns later he or she will see its previous uploaded images.

```json
{
  "basketId": "CurrentShopBasketId",
  "shopUserId": "CurrentShopCustomerId"
}
```

We are working on a method to assign an existing `basketId` to a `shopUserId` in the case the user logs in after he or she has already designed his or her artwork. So you can ensure that even with late sign in or user creation the existing uploaded images are assigned to that customer.

## &nbsp;

## Store and Recall the Design Work

To store the result of what your customer has configured in Printess you can simply call `printess.saveJson()`. In return you will get a token that yu can easily use to load this state if the customer returns or want to make changes. You also can use this token to load the customers design from the admin-view to apply fixes you might have received via email or phone.

**Save customers work**

```js
const myToken = await printess.saveJson();
```

**Load customers work**

```js
await printess.loadJson(myToken);
```

To test it, we added a button in the toolbar **Save State**, which saves the current state and returns a token to load it later. Just try it, make some other changes or even load a different template, and then press **Load Stated**, paste the token to the prompt and you will see the state you prevoiusly stored.

## &nbsp;

## Creating a Thumbnail Image

After the buyer has put the design to the shopping basket you might want to retrieve a small image of the current layout. Do get a URL of such a "Thumbnail" you can call:

```js
const fileName = 'thumb_' + new Date().getTime() + '.png';
const documentName = '';
const width = 400; // max is 400
const height = 400; // max is 400

printess
  .renderFirstPageImage(fileName, documentName, width, height)
  .then((thumbnailUrl) => {
    window.open(thumbnailUrl);
  });
```

**fileName**: has to be set, so you can put the basket ID here to override an existing image.

**documentName**: can be set if you for example want a thumbnail of a specific preview document. Otherwise the primary document will be taken. If you want to get a thumbnail of any existing preview document just pass **"!PREVIEW!"**. If no "preview"-document is found it falls back to the "primary" document and then to the first document of the template. You can see this in action on the "T-Shirt" example.

**width**: the maximum width of the thumbnail based on aspect ratio of the document the resulting thumbnail-width can smaller.

**height**: the maximum height of the thumbnail based on aspect ratio of the document the resulting thumbnail-height can smaller.

_TIP:_ Press the _Create Thumbnail_ Button to show a thumbnail of the current Template.

> :warning: The thumbnail generation might take a couple of seconds. If you request the thumbnail when the buyer clicks **continue** - you need to show an overlay screen and wait for the call to finish before you unload the Printess editor!

## &nbsp;

## Passing Form Fields to your Shop

Printess has the concept of **Form Fields** which can be created by the designer and changed by the buyer. Those Form Fields can contain information which are **price relevant** like material or color. The **Sign** template which you see when running _index.html_ exposes a couple of such Form Fields. **Material**, **Size** - and if a solid material is selected - **Drill Holes** and **Varnish**. All 4 Form Fields are possibly price relevant so the eCommerce application must know if any of this values has been changed. To achieve this, you can pass a very simple callback to _attachPrintess_, where you then can adjust your basket settings to the users choices.

```js
const formFieldChanged = (name, value) => {
  alert('Form Field: [' + name + "] changed to '" + value + "'");
};
printess.attachPrintess({
  /* ... all other properties ... */
  formFieldChangedCallback: formFieldChanged,
});
```

## &nbsp;

## Congratulations!

You now know everything to get started with the Printess Editor. Have fun and please let us know if you struggle.

## &nbsp;

# Advanced Custom Ui

There are two ways to add the Printess editor to your website.

In most cases the easy approach of using **Printess Ui** will be the way to go. Just provide a div and let Printess do the heavy lifting. After the buyer has configured its document, you take the JSON and pass it to your shopping basket. You can also tweak the Ui with CSS.

The second option **Custom Ui** reduces Printess to a pure view-container which will not expose any Ui other then the editable area. All controls and inputs must be provided by your website. This will give you full control on how your website looks. But you have to handle selection-change and page-change callbacks to update your UI, which in return needs to update Printess properties via the js-api.

In the getting-started application you can toggle between both implementations whereby the **Custom Ui** is just a very basic example of what is possible. No styling has been applied to keep the code easy to read.
