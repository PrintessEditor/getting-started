
import { iconName, iExternalListMeta, iExternalFieldListEntry, iExternalProperty, iExternalSnippetCluster, iExternalSpreadInfo, iPrintessApi, iMobileUIButton, iExternalMetaPropertyKind, MobileUiState } from "./printess-editor";


//declare const bootstrap: any;

//const textStyleMode: textStyleModeEnum = "default"; //  "default" | "all-paragraphs" | "all-paragraphs-if-no-selection"


(<any>window).uiHelper = {
  getPropertyControl: getPropertyControl,
  renderGroupSnippets: renderGroupSnippets,
  renderLayoutSnippets: renderLayoutSnippets,
  getOverlay: getOverlay,
  getDoneButton: getDoneButton,
  renderPageNavigation: renderPageNavigation,
  renderMobileUi: renderMobileUi,
  getMobileButtons: getMobileButtons,
  renderMobileToolbar: renderMobileToolbar
}
console.log("helpers loaded");



/*
 * Renders a control for a given property 
 */
function getPropertyControl(printess: iPrintessApi, p: iExternalProperty, metaProperty?: iExternalMetaPropertyKind, forMobile: boolean = false): HTMLElement {

  switch (p.kind) {

    case "title":
      return getTitle(p);

    case "background-button":
      return getChangeBackgroundButton(printess);

    case "single-line-text":
      return getSingleLineTextBox(printess, p);

    case "text-area":
      return getTextArea(printess, p, forMobile);

    case "multi-line-text":
      if (forMobile) {
        switch (metaProperty) {
          case "text-style-color":
            return getColorDropDown(printess, p, "color");
          case "text-style-font":
            return getFontDropDown(printess, p, true)
          case "text-style-hAlign":
            return getHAlignControl(printess, p, true);
          case "text-style-size":
            return getFontSizeDropDown(printess, p, true);
          case "text-style-vAlign":
            return getVAlignControl(printess, p, true);
          default:
            return getMultiLineTextBox(printess, p, forMobile)
        }
      } else {
        return getMultiLineTextBox(printess, p, forMobile);
      }

    case "selection-text-style":
      return getTextStyleControl(printess, p);


    case "color":
      return getColorDropDown(printess, p, undefined, forMobile);
    // return getColorControl(printess, p);

    case "number":
      return getNumberSlider(printess, p);

    case "image":
      if (forMobile) {
        if (metaProperty) {
          switch (metaProperty) {
            case "image-sepia":
            case "image-brightness":
            case "image-contrast":
            case "image-hueRotate":
            case "image-vivid":
              return getNumberSlider(printess, p, metaProperty);
            case "image-scale":
              return getImageScaleControl(printess, p);
          }
          const d = document.createElement("div");
          d.innerText = "Property Control no found";
          return d;
        } else {
          return getImageUploadControl(printess, p, undefined, forMobile);
        }
      }
      return getTabPanel([
        { id: "upload", title: "Upload Image", content: getImageUploadControl(printess, p) },
        { title: "Filter", id: "filter", content: getImageFilterControl(printess, p) }
      ]);


    case "select-list":
      return getDropDown(printess, p, forMobile);

    case "image-list":
      return getImageSelectList(printess, p);

  }


  const div = document.createElement("div");
  div.innerText = "Property not found: " + p.kind;
  return div;

}

/*
 * All varoious controls rendering 
 */


function getChangeBackgroundButton(printess: iPrintessApi): HTMLElement {
  const ok = document.createElement("button");
  ok.className = "btn btn-secondary"
  ok.style.alignSelf = "flex-start";
  ok.innerText = "Change Background";
  ok.onclick = () => {
    printess.selectBackground();
  }
  return ok;
}

function getDoneButton(printess: iPrintessApi): HTMLElement {
  const ok = document.createElement("button");
  ok.className = "btn btn-primary"
  ok.innerText = "Done";
  ok.style.alignSelf = "start";
  ok.style.padding = "5px";
  ok.onclick = () => {
    printess.clearSelection();
  }
  return ok;
}

/*
function getColorControl(printess: iPrintessApi, p: iExternalProperty): HTMLElement {
  const cp = document.createElement("input");
  cp.type = "color";
  cp.value = p.value.toString();
  cp.onchange = () => {
    printess.setProperty(p.id, cp.value)
  }
  return cp;
}
*/

function getTextStyleControl(printess: iPrintessApi, p: iExternalProperty): HTMLElement {
  const textPropertiesDiv = document.createElement("div");
  textPropertiesDiv.classList.add("mb-3");

  if (!p.textStyle) {
    return textPropertiesDiv;
  }

  const group1 = document.createElement("div");
  group1.className = "input-group mb-3";
  const pre1 = document.createElement("div");
  pre1.className = "input-group-prepend";
  if (p.textStyle.allows.indexOf("color") >= 0) {
    getColorDropDown(printess, p, "color", false, pre1);
  }
  if (p.textStyle.allows.indexOf("size") >= 0) {
    getFontSizeDropDown(printess, p, false, pre1);
  }

  group1.appendChild(pre1);

  if (p.textStyle.allows.indexOf("font") >= 0) {
    getFontDropDown(printess, p, false, group1);
  }
  //  addLabel(dropdown, p, "Font");
  textPropertiesDiv.appendChild(group1);

  const group2 = document.createElement("div");
  group2.className = "input-group mb-3";

  const pre2 = document.createElement("div");
  pre2.className = "input-group-prepend";

  if (p.textStyle.allows.indexOf("horizontalAlignment") >= 0) {
    group2.appendChild(getHAlignControl(printess, p, false));
  }

  const spacer = document.createElement("div");
  spacer.style.width = "10px";
  group2.appendChild(spacer);
  if (p.textStyle.allows.indexOf("verticalAlignment") >= 0) {
    group2.appendChild(getVAlignControl(printess, p, false));
  }
  textPropertiesDiv.appendChild(group2);

  return textPropertiesDiv;
}

function getMultiLineTextBox(printess: iPrintessApi, p: iExternalProperty, forMobile: boolean): HTMLElement {

  const ta = getTextArea(printess, p, forMobile);
  if (forMobile) {
    return ta;
  } else {

    const container = document.createElement("div");
    container.appendChild(getTextStyleControl(printess, p));

    container.appendChild(ta);

    /*  const textPropertiesDiv = document.createElement("div");
      textPropertiesDiv.style.marginBottom = "2px";
      textPropertiesDiv.classList.add("text-properties");
      textPropertiesDiv.appendChild(getFontList(printess, p));
      textPropertiesDiv.appendChild(getFontSizeSelect(printess, p));
      textPropertiesDiv.appendChild(getHAlignList(printess, p));
      textPropertiesDiv.appendChild(getVAlignList(printess, p));
      textPropertiesDiv.appendChild(getFontColorPicker(printess, p));
      container.appendChild(textPropertiesDiv);*/

    // container.appendChild(inp);
    return container;
  }
}
function getSingleLineTextBox(printess: iPrintessApi, p: iExternalProperty): HTMLElement {

  const inp = document.createElement("input");
  inp.type = "text";
  inp.value = p.value.toString();
  inp.onkeyup = () => {
    printess.setProperty(p.id, inp.value);
    const mobileButtonDiv = document.getElementById(p.id + ":");
    if (mobileButtonDiv) {
      p.value = inp.value;
      drawButtonContent(printess, <HTMLDivElement>mobileButtonDiv, [p]);
    }
  }
  return addLabel(inp, p);
}

function getTitle(p: iExternalProperty): HTMLElement {
  const container = document.createElement("div");

  const hr = document.createElement("hr");
  container.appendChild(hr);

  const h1 = document.createElement("h2");
  h1.innerText = p.label;

  container.appendChild(h1);
  container.appendChild(hr);
  return container;
}


function getTextArea(printess: iPrintessApi, p: iExternalProperty, forMobile: boolean): HTMLElement {

  const inp = document.createElement("textarea");
  inp.value = p.value.toString();
  inp.onkeyup = () => {
    printess.setProperty(p.id, inp.value);
    const mobileButtonDiv = document.getElementById(p.id + ":");
    if (mobileButtonDiv) {
      p.value = inp.value;
      drawButtonContent(printess, <HTMLDivElement>mobileButtonDiv, [p]);
    }
  }
  inp.rows = 6;

  if (forMobile) {
    inp.className = "mobile-text-area";
    return inp;
  } else {
    inp.className = "desktop-text-area";
    return addLabel(inp, p);
  }


}

function addLabel(input: HTMLElement, p: iExternalProperty, label?: string): HTMLElement {
  input.classList.add("form-control");

  if (!p.label && !label) {
    return input;
  }

  const container = document.createElement("div");
  container.className = "mb-3"

  const htmlLabel = document.createElement("label");
  htmlLabel.className = "form-label";
  htmlLabel.setAttribute("for", "inp" + p.id);
  htmlLabel.innerText = (label || p.label);
  input.id = "inp" + p.id;


  container.appendChild(htmlLabel);
  container.appendChild(input);

  return container;
}

/*
function getSelectList(printess: iPrintessApi, p: iExternalProperty): HTMLElement {
  const sel = document.createElement("select");
  if (p.formMeta && p.formMeta.list) {
    for (const entry of p.formMeta.list) {
      const opt = document.createElement("option");
      opt.value = entry.key;
      opt.innerText = entry.label;
      if (p.value === entry.key) {
        opt.selected = true;
      }
      sel.appendChild(opt);
    }
  }
  sel.onchange = () => {
    const newValue = sel.options[sel.selectedIndex].value;
    printess.setProperty(p.id, newValue);
  }
  return sel;
}
 
function getImageSelectList1(printess: iPrintessApi, p: iExternalProperty): HTMLElement {
 
  const dropdown = document.createElement("div");
  dropdown.classList.add("dropdown");
 
  if (p.formMeta && p.formMeta.list) {
    const selectedItem = p.formMeta?.list?.filter(itm => itm.key === p.value)[0] ?? null;
    const button = document.createElement("button");
    button.classList.add("dropbtn");
    if (selectedItem) {
      button.appendChild(getDropdownItemContent(p.formMeta, selectedItem))
    }
    button.onclick = () => {
      dropdown.classList.add("show");
      document.addEventListener("mousedown", () => {
        dropdown.classList.remove("show");
      }, { once: true })
    }
    dropdown.appendChild(button);
    const ddContent = document.createElement("div");
    ddContent.classList.add("dropdown-content");
    ddContent.onmousedown = (ev: MouseEvent) => {
      ev.stopImmediatePropagation();
    }
    for (const entry of p.formMeta.list) {
      const a = document.createElement("a");
      a.href = "#";
      a.onclick = () => {
        printess.setProperty(p.id, entry.key);
        if (p.formMeta) {
          button.innerHTML = "";
          button.appendChild(getDropdownItemContent(p.formMeta, entry));
          dropdown.classList.remove("show");
        }
      }
      a.appendChild(getDropdownItemContent(p.formMeta, entry));
      ddContent.appendChild(a)
    }
    dropdown.appendChild(ddContent);
  }
  return dropdown;
}*/


function getImageSelectList(printess: iPrintessApi, p: iExternalProperty): HTMLElement {
  const container = document.createElement("div");
  if (p.listMeta && p.listMeta.list) {

    if (p.listMeta.imageCss) {
      const st = document.createElement("style");
      const css = p.listMeta.imageCss.replace(/\.image/g, ".image" + p.id);
      st.innerHTML = css.split("\n").join("");
      container.appendChild(st);
    }

    const imageListWrapper = document.createElement("div");
    imageListWrapper.classList.add("image-select-list-wrapper");
    const imageList = document.createElement("div");
    imageList.classList.add("image-select-list");

    for (const entry of p.listMeta.list) {
      const thumb = document.createElement("div");
      thumb.className = "image" + p.id;
      thumb.style.backgroundImage = "url('" + entry.imageUrl + "')";
      thumb.style.width = p.listMeta.thumbWidth + "px";
      thumb.style.height = p.listMeta.thumbHeight + "px";
      if (entry.key === p.value) thumb.classList.add("selected");

      thumb.onclick = () => {
        printess.setProperty(p.id, entry.key);
        imageList.childNodes.forEach((c) => (<HTMLDivElement>c).classList.remove("selected"));
        thumb.classList.add("selected");
      }
      imageList.appendChild(thumb);
    }
    container.appendChild(imageList);
  }

  return container;
}



function getColorDropDown(printess: iPrintessApi, p: iExternalProperty, metaProperty?: "color", forMobile: boolean = false, dropdown?: HTMLDivElement): HTMLElement {

  if (!dropdown) {
    dropdown = document.createElement("div");
    dropdown.classList.add("btn-group");
  }

  const colors = printess.getColors(p.id);

  /*
  select.onchange = () => {
    // alert(p.id + "has changed to " + select.value);
    printess.setTextStyleProperty(p.id, "color", select.value, textStyleMode)
  }*/

  //const selectedItem = colors.filter(itm => itm.name === p.value || itm.color === p.value)[0] ?? null;

  const button = document.createElement("button");

  if (!forMobile) {

    button.className = "btn btn-light dropdown-toggle"; // color-picker-button";
    //  button.style.display = "flex";
    button.dataset.bsToggle = "dropdown";
    button.dataset.bsAutoClose = "true"
    button.setAttribute("aria-expanded", "false");
    if (metaProperty === "color" && p.textStyle) {
      button.style.backgroundColor = p.textStyle.color;
    } else {
      button.style.backgroundColor = p.value.toString();
    }

    dropdown.appendChild(button);
  }

  const ddContent = document.createElement("div");
  ddContent.className = "dropdown-menu";
  ddContent.setAttribute("aria-labelledby", "defaultDropdown");
  ddContent.style.width = "240px";

  const colorList = document.createElement("div");
  colorList.className = "color-picker-drop-down";

  for (const f of colors) {
    const color = document.createElement("a");
    color.href = "#";
    color.className = "color-picker-color dropdown-item";
    color.style.backgroundColor = f.color;
    color.dataset.color = f.name;
    color.title = f.name;
    color.onclick = () => {
      if (metaProperty === "color") {
        printess.setTextStyleProperty(p.id, metaProperty, f.name);
        const mobileButtonDiv = document.getElementById(p.id + ":" + (metaProperty ?? ""));
        if (mobileButtonDiv && p.textStyle) {
          p.textStyle.color = f.color;
          drawButtonContent(printess, <HTMLDivElement>mobileButtonDiv, [p]);
        }
      } else {
        printess.setProperty(p.id, f.name);
        p.value = f.color;
        const mobileButtonDiv = document.getElementById(p.id + ":" + (metaProperty ?? ""));
        if (mobileButtonDiv) {
          drawButtonContent(printess, <HTMLDivElement>mobileButtonDiv, [p]);
        }
      }
      if (!forMobile) button.style.backgroundColor = f.color;
    }
    colorList.appendChild(color);
  }


  if (forMobile) {
    return colorList;
  } else {
    ddContent.appendChild(colorList);
    dropdown.appendChild(ddContent);
    return dropdown;
  }
}

function getDropDown(printess: iPrintessApi, p: iExternalProperty, asList: boolean): HTMLElement {

  const dropdown = document.createElement("div");
  dropdown.classList.add("btn-group");

  const ddContent = document.createElement("ul");

  if (p.listMeta && p.listMeta.list) {
    const selectedItem = p.listMeta.list.filter(itm => itm.key === p.value)[0] ?? null;
    const button = document.createElement("button");
    button.className = "btn btn-light dropdown-toggle";
    // button.style.display = "flex";
    button.dataset.bsToggle = "dropdown";
    button.dataset.bsAutoClose = "true"
    button.setAttribute("aria-expanded", "false");
    if (selectedItem) {
      button.appendChild(getDropdownItemContent(p.listMeta, selectedItem))
    }
    dropdown.appendChild(button);

    if (asList) {
      ddContent.classList.add("list-group");
    } else {
      ddContent.classList.add("dropdown-menu");
      ddContent.setAttribute("aria-labelledby", "defaultDropdown");
      ddContent.style.width = "100%";
    }
    for (const entry of p.listMeta.list) {
      const li = document.createElement("li");
      if (asList) {
        li.classList.add("list-group-item");
        if (entry === selectedItem) {
          li.classList.add("active");
        }
      }
      const a = document.createElement("a");
      a.href = "#";
      a.classList.add("dropdown-item");
      a.onclick = () => {
        printess.setProperty(p.id, entry.key);
        if (p.listMeta) {
          button.innerHTML = "";
          button.appendChild(getDropdownItemContent(p.listMeta, entry));
          if (asList) {
            ddContent.querySelectorAll("li").forEach(li => li.classList.remove("active"));
            li.classList.add("active")
          }
        }
      }
      a.appendChild(getDropdownItemContent(p.listMeta, entry));
      li.appendChild(a);
      ddContent.appendChild(li)
    }
    dropdown.appendChild(ddContent);
  }
  if (asList) {
    return ddContent;
  } else {
    return dropdown
  }
}

function getDropdownItemContent(meta: iExternalListMeta, entry: iExternalFieldListEntry): HTMLElement {
  const div = document.createElement("div");
  div.classList.add("dropdown-list-entry");

  if (entry.imageUrl) {
    const img = document.createElement("div");
    img.classList.add("dropdown-list-image");
    img.style.backgroundImage = `url('${entry.imageUrl}')`;
    img.style.width = meta.thumbWidth + "px";
    img.style.height = meta.thumbHeight + "px";
    div.appendChild(img);
  }

  const label = document.createElement("div");
  label.classList.add("dropdown-list-label");
  label.innerText = entry.label;
  div.appendChild(label);

  return div;
}



function getTabPanel(tabs: Array<{ title: string, id: string, content: HTMLElement }>): HTMLDivElement {

  const panel = document.createElement("div");

  const ul = document.createElement("ul")
  ul.className = "nav nav-tabs";
  ul.setAttribute("role", "tablist");
  for (const t of tabs) {
    const li = document.createElement("li");
    li.className = "nav-item";
    const a = document.createElement("a");
    a.className = "nav-link";
    a.innerText = t.title;
    a.dataset.bsToggle = "tab";
    a.dataset.bsTarget = "#tab-" + t.id;
    if (t === tabs[0]) {
      a.classList.add("active")
    }
    li.appendChild(a);
    ul.appendChild(li);
  }

  const content = document.createElement("div");
  content.className = "tab-content card";
  content.style.borderTop = "none";
  for (const t of tabs) {
    const pane = document.createElement("div");
    pane.id = "tab-" + t.id;
    pane.className = "tab-pane card-body fade";

    pane.setAttribute("role", "tabpanel");
    if (t === tabs[0]) {
      pane.classList.add("show")
      pane.classList.add("active")
    }

    pane.appendChild(t.content);
    content.appendChild(pane);
  }

  panel.appendChild(ul);
  panel.appendChild(content);
  return panel;

}

function getImageFilterControl(printess: iPrintessApi, p: iExternalProperty): HTMLElement {
  const container = document.createElement("div");
  /*** Effects ***/
  container.appendChild(getNumberSlider(printess, p, "image-brightness"));
  container.appendChild(getNumberSlider(printess, p, "image-contrast"));
  container.appendChild(getNumberSlider(printess, p, "image-vivid"));
  container.appendChild(getNumberSlider(printess, p, "image-sepia"));
  return container;
}

function getImageUploadControl(printess: iPrintessApi, p: iExternalProperty, container?: HTMLDivElement, forMobile: boolean = false): HTMLElement {

  // for redraw after upoad, take passed container instead
  container = container || document.createElement("div");


  /***+ IMAGE UPLOAD ****/
  const fileUpload = document.createElement("div");
  fileUpload.className = "mb-3";

  const progressDiv = document.createElement("div");
  progressDiv.className = "progress";
  const progressBar = document.createElement("div");
  progressBar.className = "progress-bar";
  progressBar.style.width = "0%";
  progressDiv.style.display = "none";
  progressDiv.appendChild(progressBar);


  const inp = document.createElement("input");
  inp.type = "file";
  inp.id = p.id;
  inp.className = "form-control"
  inp.accept = "image/png,image/jpg,image/jpeg";
  inp.multiple = true;
  inp.onchange = () => {

    // printess.setProperty(p.id, inp.value);
    if (inp && inp.files?.length) {
      inp.disabled = true;
      inp.style.display = "none";
      if (scaleControl) scaleControl.style.display = "none";
      imagePanel.style.display = "none";
      progressDiv.style.display = "flex";

      // can upload multiple files at once
      printess.uploadImages(inp.files, (progress) => {
        progressBar.style.width = (progress * 100) + "%"
      }
        , true); // true auto assigns image and triggers selection change wich redraws this control.

      // optional: promise resolution returns list of added images 
      // if auto assign is "false" you must reset progress-bar width and control visibilty manually
      // .then(images => {console.log(images)};

    }
  };

  /* optinally add label before upload */
  const uploadLabel = document.createElement("label");
  uploadLabel.className = "form-label";
  uploadLabel.innerText = "Upload images form your device";
  uploadLabel.setAttribute("for", p.id);
  // remove comments below to  add label
  // fileUpload.appendChild(uploadLabel);


  fileUpload.appendChild(inp);
  container.appendChild(progressDiv);
  container.appendChild(fileUpload);



  const imagePanel = document.createElement("div");
  imagePanel.className = "image-panel";

  const imageListWrapper = document.createElement("div");
  imageListWrapper.classList.add("image-list-wrapper");
  const imageList = document.createElement("div");
  imageList.classList.add("image-list");
  const images = printess.getImages(p.id);
  const mainThumb = document.createElement("div");
  if (p.imageMeta?.thumbCssUrl) {
    mainThumb.className = "main";
    mainThumb.style.backgroundImage = p.imageMeta.thumbCssUrl;
    imagePanel.appendChild(mainThumb);
  }
  for (const im of images) {
    const thumb = document.createElement("div");
    thumb.style.backgroundImage = im.thumbCssUrl;
    if (im.id === p.value) thumb.style.border = "2px solid red";
    thumb.onclick = () => {
      printess.setProperty(p.id, im.id);
    }
    imageList.appendChild(thumb);
  }
  imageListWrapper.appendChild(imageList);
  imagePanel.appendChild(imageListWrapper)



  /*** SCALE ***/
  let scaleControl: HTMLElement | undefined = undefined;
  if (!forMobile) {
    container.appendChild(imagePanel);
    scaleControl = getImageScaleControl(printess, p);
    container.appendChild(scaleControl)
    return container;
  } else {
    container.appendChild(imageList);
    return container;
  }

}


function getImageScaleControl(printess: iPrintessApi, p: iExternalProperty): HTMLElement {
  const scaleRangeLabel = document.createElement("label");
  const scaleRangeLabelCaption = document.createElement("span");
  const scaleRange: HTMLInputElement = document.createElement("input");
  scaleRange.type = "range";
  scaleRange.min = p.imageMeta?.scaleHints.min.toString() ?? "0";
  scaleRange.max = p.imageMeta?.scaleHints.max.toString() ?? "0";
  scaleRange.step = "0.01";
  scaleRange.value = p.imageMeta?.scale.toString() ?? "0";
  scaleRange.oninput = () => {
    const newScale = parseFloat(scaleRange.value);
    printess.setImageMetaProperty(p.id, "scale", newScale);
    if (p.imageMeta) {
      p.imageMeta.scale = newScale;
      scaleRangeLabelCaption.textContent = "Scale(" + Math.floor(p.imageMeta.scaleHints.dpiAtScale1 / newScale) + "dpi)";
      const mobileButtonDiv = document.getElementById(p.id + ":image-scale");
      if (mobileButtonDiv) {
        drawButtonContent(printess, <HTMLDivElement>mobileButtonDiv, [p]);
      }

    }

  }
  if (p.imageMeta) {
    scaleRangeLabelCaption.textContent = "Scale(" + Math.floor(p.imageMeta.scaleHints.dpiAtScale1 / p.imageMeta.scale) + "dpi)";
  }
  scaleRangeLabel.style.width = "100%";
  scaleRange.style.width = "80%";
  scaleRangeLabel.appendChild(scaleRangeLabelCaption);
  scaleRangeLabel.appendChild(scaleRange);
  return scaleRangeLabel;
}


function getNumberSlider(printess: iPrintessApi, p: iExternalProperty, metaProperty: "image-hueRotate" | "image-brightness" | "image-contrast" | "image-vivid" | "image-sepia" | null = null): HTMLElement {
  // creaate slider for all "Number" properties
  const ui = printess.getNumberUi(p, metaProperty);
  if (!ui) {
    const er = document.createElement("div");
    er.textContent = "Can't get number UI for " + p.id + " / metaProperty:" + (metaProperty || "");
    return er;
  }
  const rangeLabel = document.createElement("label");
  const range: HTMLInputElement = document.createElement("input");
  range.className = "form-range";
  // <label for="customRange1" class="form-label">Example range</label>
  // <input type="range" class="form-range" id="customRange1">"
  range.type = "range";
  range.min = ui.meta.min.toString();
  range.max = ui.meta.max.toString();
  range.step = ui.meta.step.toString();
  range.value = ui.value.toString();
  range.oninput = () => {
    // will also update model properly
    printess.setNumberUiProperty(p, metaProperty, parseFloat(range.value));
    // update mobile circle if present
    const mobileButtonDiv = document.getElementById(p.id + ":" + (metaProperty ?? ""));
    if (mobileButtonDiv) {
      drawButtonContent(printess, <HTMLDivElement>mobileButtonDiv, [p]);
    }
  }
  const span = document.createElement("span");
  span.textContent = metaProperty ? metaProperty : p.label;
  rangeLabel.appendChild(span);
  rangeLabel.appendChild(range);
  return rangeLabel;
}




function getFontSizeSelect(printess: iPrintessApi, p: iExternalProperty) {
  // alternativey show slider: return getNumberSlider(p, "text-style-size");

  const select = document.createElement("select");
  select.className = "form-control";
  select.style.width = "60px";

  select.value = p.textStyle?.size ?? "12pt";
  select.onchange = () => {
    printess.setTextStyleProperty(p.id, "size", select.value)
  }
  if (!document.getElementById("font-size-data-list")) {
    const sizes = ["6pt", "7pt", "8pt", "10pt", "12pt", "14pt", "16pt", "20pt", "24pt", "28pt", "32pt", "36pt", "42pt", "48pt"];
    for (const s of sizes) {
      const option = document.createElement("option");
      option.value = s;
      option.innerText = s;
      select.appendChild(option);
    }
  }

  return select;

}

function getFontSizeDropDown(printess: iPrintessApi, p: iExternalProperty, asList: boolean, dropdown?: HTMLDivElement): HTMLElement {

  if (!dropdown) {
    dropdown = document.createElement("div");
    dropdown.classList.add("btn-group");
    dropdown.classList.add("form-control");
  }
  dropdown.style.padding = "0";

  const sizes = ["6pt", "7pt", "8pt", "10pt", "12pt", "14pt", "16pt", "20pt", "24pt", "28pt", "32pt", "36pt", "42pt", "48pt", "54pt", "60pt", "66pt", "72pt", "78pt"];
  const ddContent = document.createElement("ul");
  if (p.textStyle && sizes.length) {
    const selectedItem = sizes.filter(itm => itm === p.textStyle?.size ?? "??pt")[0] ?? null;
    const button = document.createElement("button");
    button.className = "btn btn-light dropdown-toggle";
    //  button.style.display = "flex";
    button.dataset.bsToggle = "dropdown";
    button.dataset.bsAutoClose = "true"
    button.setAttribute("aria-expanded", "false");
    if (selectedItem) {
      button.innerText = selectedItem;
    } else {
      button.innerText = p.textStyle?.size ?? "??pt";
    }
    dropdown.appendChild(button);

    if (asList) {
      ddContent.classList.add("list-group");
    } else {
      ddContent.classList.add("dropdown-menu");
      ddContent.setAttribute("aria-labelledby", "defaultDropdown");
      ddContent.style.width = "100%";
      ddContent.style.maxHeight = "400px";
    }

    ddContent.style.overflow = "hidden auto";

    for (const entry of sizes) {
      const li = document.createElement("li");
      if (asList) {
        li.classList.add("list-group-item");
        if (entry === selectedItem) {
          li.classList.add("active");
        }
      }
      //const a = document.createElement("a");
      // a.href = "#";
      li.classList.add("dropdown-item");
      li.onclick = () => {
        button.innerHTML = "";
        printess.setTextStyleProperty(p.id, "size", entry);
        if (p.textStyle) p.textStyle.size = entry;
        button.innerText = entry;
        if (asList) {
          ddContent.querySelectorAll("li").forEach(li => li.classList.remove("active"));
          li.classList.add("active")
          // update button 
          const mobileButtonDiv = document.getElementById(p.id + ":text-style-size");
          if (mobileButtonDiv) {
            drawButtonContent(printess, <HTMLDivElement>mobileButtonDiv, [p]);
          }
        }

      }

      li.innerText = entry;
      //   li.appendChild(a);
      ddContent.appendChild(li)
    }
    dropdown.appendChild(ddContent);
  }
  if (asList) {
    return ddContent;
  } else {
    return dropdown
  }


}

function getFontDropDown(printess: iPrintessApi, p: iExternalProperty, asList: boolean, dropdown?: HTMLDivElement): HTMLElement {

  if (!dropdown) {
    dropdown = document.createElement("div");
    dropdown.classList.add("btn-group");
    dropdown.classList.add("form-control");
  }
  dropdown.style.padding = "0";

  const fonts = printess.getFonts(p.id);
  const ddContent = document.createElement("ul");

  if (p.textStyle && fonts.length) {
    const selectedItem = fonts.filter(itm => itm.name === p.textStyle?.font ?? "")[0] ?? null;
    const button = document.createElement("button");
    button.className = "btn btn-light dropdown-toggle";
    // button.style.display = "flex";
    button.dataset.bsToggle = "dropdown";
    button.dataset.bsAutoClose = "true"
    button.setAttribute("aria-expanded", "false");
    if (selectedItem) {
      button.appendChild(getDropdownImageContent(selectedItem.thumbUrl));
    }
    dropdown.appendChild(button);

    if (asList) {
      ddContent.classList.add("list-group");
    } else {
      ddContent.classList.add("dropdown-menu");
      ddContent.setAttribute("aria-labelledby", "defaultDropdown");
      ddContent.style.width = "100%";
      ddContent.style.maxHeight = "400px";
    }


    ddContent.style.overflow = "hidden auto";

    for (const entry of fonts) {
      const li = document.createElement("li");

      li.classList.add("dropdown-item");

      if (asList) {
        li.classList.add("list-group-item");
        if (entry === selectedItem) {
          li.classList.add("active");
        }
      }

      li.onclick = () => {
        printess.setTextStyleProperty(p.id, "font", entry.name);
        if (p.textStyle) {
          p.textStyle.font = entry.name;
        }
        if (asList) {
          ddContent.querySelectorAll("li").forEach(li => li.classList.remove("active"));
          li.classList.add("active");
          // update button 
          const mobileButtonDiv = document.getElementById(p.id + ":text-style-font");
          if (mobileButtonDiv) {
            drawButtonContent(printess, <HTMLDivElement>mobileButtonDiv, [p]);
          }
        } else {
          button.innerHTML = "";
          button.appendChild(getDropdownImageContent(entry.thumbUrl));
        }


      }
      li.appendChild(getDropdownImageContent(entry.thumbUrl));

      ddContent.appendChild(li)
    }
    dropdown.appendChild(ddContent);
  }
  if (asList) {
    return ddContent;
  } else {
    return dropdown
  }


}

function getDropdownImageContent(thumbUrl: string): HTMLDivElement {
  const img = document.createElement("img");
  img.src = thumbUrl;
  img.style.height = "20px";
  /* const div = document.createElement("div");
   div.style.width = "100%";
   div.style.display = "flex";
   div.appendChild(img);*/
  return img;
}


function getVAlignControl(printess: iPrintessApi, p: iExternalProperty, forMobile: boolean) {

  const group = document.createElement("div");
  group.className = "btn-group";
  if (forMobile) {
    group.classList.add("form-control");
  }

  for (const v of ["top", "center", "bottom"]) {
    let icon: iconName = "align-top";
    switch (v) {
      case "center": icon = "align-middle"; break;
      case "bottom": icon = "align-bottom"; break;
    }

    const id = p.id +  "btnVAlignRadio" + v;

    group.appendChild(getRadioButton(printess, p, id, "vAlign", v));
    group.appendChild(getRadioLabel(printess, p, id, "vAlign", icon));

  }

  return group;
}

function getHAlignControl(printess: iPrintessApi, p: iExternalProperty, forMobile: boolean) {

  const group = document.createElement("div");
  group.className = "btn-group";
  if (forMobile) {
    group.classList.add("form-control");
  }
  for (const v of ["left", "right", "center", "justifyLeft"]) { // you can missing options if needed:  "justifyCenter", "justifyRight", "justifyJustify" 
    let icon: iconName = "text-align-left";
    switch (v) {
      case "right": icon = "text-align-right"; break;
      case "center": icon = "text-align-center"; break;
      case "justifyLeft": icon = "text-align-justify-left"; break;
      case "justifyCenter": icon = "text-align-justify-center"; break;
      case "justifyRight": icon = "text-align-justify-right"; break;
      case "justifyJustify": icon = "text-align-justify-justify"; break;
    }

    //  <input type="radio" class="btn-check" name="btnradio" id="btnradio1" autocomplete="off" checked>
    //  <label class="btn btn-outline-primary" for="btnradio1">Radio 1</label>

    const id =  p.id +  "btnHAlignRadio" + v;

    group.appendChild(getRadioButton(printess, p, id, "hAlign", v));
    group.appendChild(getRadioLabel(printess, p, id, "hAlign", icon));

  }

  return group;
}

function getRadioLabel(printess: iPrintessApi, p: iExternalProperty, id: string, name: string, icon: iconName): HTMLLabelElement {
  const label = document.createElement("label");
  label.setAttribute("for", id);
  label.className = "btn btn-outline-dark";
  label.style.width = "46px";
  label.style.flex = "0 0 auto";
  const svg = printess.getIcon(icon);
  svg.style.width = "20px";
  svg.style.height = "20px";
  label.appendChild(svg);
  return label;
}

function getRadioButton(printess: iPrintessApi, p: iExternalProperty, id: string, name: "hAlign" | "vAlign", value: string): HTMLInputElement {
  const radio = document.createElement("input");
  radio.type = "radio";
  radio.className = "btn-check";
  radio.dataset.value = value;
  radio.name = name + "_" + p.id;
  radio.id = id;
  if (p.textStyle && p.textStyle[name] === value) {
    radio.checked = true;
  }
  radio.onclick = () => {
    printess.setTextStyleProperty(p.id, name, value);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (p.textStyle) p.textStyle[name] = value;

    // update mobile button if exists:
    const mobileButtonDiv = document.getElementById(p.id + ":" + "text-style-" + name);
    if (mobileButtonDiv) {
      drawButtonContent(printess, <HTMLDivElement>mobileButtonDiv, [p]);
    }

  }
  return radio;
}


function getFontSizeBox(printess: iPrintessApi, p: iExternalProperty) {
  // alternativey show selectlist or slider: return getNumberSlider(p, "text-style-size");

  const cp = document.createElement("input");
  cp.type = "text";
  cp.className = "form-control";
  cp.value = p.textStyle?.size ?? "12pt";
  cp.setAttribute("list", "font-size-data-list");
  cp.onchange = () => {
    printess.setTextStyleProperty(p.id, "size", cp.value)
  }
  if (!document.getElementById("font-size-data-list")) {
    const sizes = ["6pt", "7pt", "8pt", "10pt", "12pt", "14pt", "16pt", "20pt", "24pt", "28pt", "32pt", "36pt", "42pt", "48pt"];
    const dl = document.createElement("datalist");
    dl.id = "font-size-data-list";
    for (const s of sizes) {
      const option = document.createElement("option");
      option.value = s;
      dl.appendChild(option);
    }
    document.body.appendChild(dl);
  }

  return cp;

}



/*
 * PAGE LIST 
 */

function renderPageNavigation(printess: iPrintessApi, spreads: Array<iExternalSpreadInfo>, _properties: Array<iExternalProperty>): void {
  console.log("All Spreads", spreads);

  // draw pages ui
  const pages = document.querySelector(".page-buttons");
  if (pages) {
    let pageNo = 0;
    pages.innerHTML = "";
    for (const spread of spreads) {
      for (let pageIndex = 0; pageIndex < spread.pages; pageIndex++) {
        pageNo++;
        const pageButton = document.createElement("div");
        pageButton.innerText = spread.name ? spread.name : "Page " + pageNo;
        if (pageIndex === spread.pages - 1) {
          pageButton.style.marginRight = "10px";
        }
        pageButton.onclick = () => {
          printess.selectSpread(spread.index, pageIndex === 0 ? "left-page" : "right-page");
        }
        pages.appendChild(pageButton);
      }
    }
  }

}



/*
 * Snippets Lists
 */

function renderGroupSnippets(printess: iPrintessApi, groupSnippets: Array<iExternalSnippetCluster>, forMobile: boolean): HTMLElement {


  const div = document.createElement("div");
  div.className = "group-snippets";



  if (groupSnippets.length > 0) {
    // no selection, show add-able snippets instead
    for (const cluster of groupSnippets) {

      const headline = document.createElement("h5");
      headline.className = "snippet-cluster-name";
      headline.textContent = cluster.name;
      div.appendChild(headline)
      const hr = document.createElement("hr");
      hr.style.width = "100%";
      div.appendChild(hr);

      for (const snippet of cluster.snippets) {
        const thumb = document.createElement("img");
        thumb.src = snippet.thumbUrl;
        thumb.style.backgroundColor = snippet.bgColor;
        thumb.style.width = "100px";
        thumb.style.height = "100%";
        thumb.style.margin = "5px";
        //  thumb.classList.add("image-icon");
        thumb.onclick = () => {
          if (forMobile) {
            div.innerHTML === "";
          }
          printess.insertGroupSnippet(snippet.snippetUrl);

          //  alert(JSON.stringify(aw));
          //printess.setProperty(p.id, im.id);
        }
        div.appendChild(thumb);
      }
    }
  }
  if (forMobile) {
    const mobile = document.createElement("div");
    mobile.className = "mobile-group-snippets-container";
    mobile.appendChild(div);
    return mobile;
  } else {
    return div;
  }
}

function renderLayoutSnippets(printess: iPrintessApi, layoutSnippets: Array<iExternalSnippetCluster>): HTMLDivElement {

  const container = document.createElement("div");
  container.className = "layout-snippet-list";
  if (layoutSnippets) {
    for (const cluster of layoutSnippets) {
      const headline = document.createElement("div");
      headline.textContent = cluster.name;
      headline.className = "snippet-cluster-name";
      if (cluster === layoutSnippets[0]) {
        headline.style.marginTop = "0";
      }
      container.appendChild(headline)

      const clusterDiv = document.createElement("div");
      clusterDiv.className = "layout-snippet-cluster";
      for (const snippet of cluster.snippets) {
        const thumb = document.createElement("img");
        thumb.src = snippet.thumbUrl;
        // thumb.style.backgroundImage = "url('" + snippet.thumbUrl + "')";
        thumb.classList.add("layout-snippet-icon");
        thumb.onclick = () => {
          printess.insertLayoutSnippet(snippet.snippetUrl);
          // close off canvas via its button, the only way it propably worked ...
          const myOffcanvas = document.getElementById("closeLayoutOffCanvas");
          if (myOffcanvas) myOffcanvas.click();
        }
        clusterDiv.appendChild(thumb);
      }
      container.appendChild(clusterDiv);
    }
  }
  return container;
}


/*
 *   Mobile UI Buttons
 */

function renderMobileUi(printess: iPrintessApi, properties: Array<iExternalProperty>, state: MobileUiState, groupSnippets: Array<iExternalSnippetCluster>) {
  let mobileUi: HTMLDivElement | null = document.querySelector(".mobile-ui");
  if (!mobileUi) {
    mobileUi = document.createElement("div");
    mobileUi.className = "mobile-ui";
    document.body.appendChild(mobileUi);
  } else {
    mobileUi.innerHTML = "";
  }


  if (state === "add") {
    // render list of group snippets
    const snippets = renderGroupSnippets(printess, groupSnippets, true);
    mobileUi.appendChild(snippets);
  } else {
    // render properties UI
    mobileUi.appendChild(getMobileButtons(printess, properties));
    const controlHost = document.createElement("div");
    controlHost.className = "mobile-control-host";
    controlHost.id = "mobile-control-host";
    mobileUi.appendChild(controlHost);
  }

  // Buttons for "add" and "back ""
  if (groupSnippets.length > 0 && state !== "add") {
    mobileUi.appendChild(getMobilePlusButton(printess, properties, groupSnippets))
  }
  if (state !== "document") {
    mobileUi.appendChild(getMobileBackButton(printess, properties, state, groupSnippets))
  }
}


function getMobilePlusButton(printess: iPrintessApi, properties: Array<iExternalProperty>, groupSnippets: Array<iExternalSnippetCluster>): HTMLDivElement {
  const button = document.createElement("div");
  button.className = "mobile-property-plus-button";

  const circle = document.createElement("div");
  circle.className = "mobile-property-circle";
  circle.onclick = () => {
    renderMobileUi(printess, properties, "add", groupSnippets)
  }

  const icon = printess.getIcon("plus");
  circle.appendChild(icon);

  button.appendChild(circle);
  return button;
}

function getMobileBackButton(printess: iPrintessApi, properties: Array<iExternalProperty>, state: MobileUiState, groupSnippets: Array<iExternalSnippetCluster>): HTMLDivElement {
  const button = document.createElement("div");
  button.className = "mobile-property-back-button";

  const circle = document.createElement("div");
  circle.className = "mobile-property-circle";
  circle.onclick = () => {
    if (state === "frames") {
      printess.clearSelection();
    } else if (state === "add") {
      renderMobileUi(printess, properties, "document", groupSnippets)
    }
  }

  const icon = printess.getIcon("arrow-left");
  circle.appendChild(icon);

  button.appendChild(circle);
  return button;
}

async function renderMobileToolbar(printess: iPrintessApi) {

  let toolbar = document.querySelector(".mobile-toolbar");
  if (!toolbar) {
    toolbar = document.createElement("div");
    toolbar.className = "mobile-toolbar";
    document.body.appendChild(toolbar);
  } else {
    toolbar.innerHTML = "";
  }

  const info = await printess.pageInfo();

  const page = document.createElement("div");
  page.className = "mobile-toolbar-page-info";

  if (!info.isFirst) {
    const previousPage = printess.getIcon("arrow-left");
    previousPage.classList.add("mobile-toolbar-page-previous");
    previousPage.onclick = () => {
      printess.previousPage();
    }
    toolbar.appendChild(previousPage);
  }

  if (!info.isLast) {
    const nextPage = printess.getIcon("arrow-right");
    nextPage.classList.add("mobile-toolbar-page-next");
    nextPage.onclick = () => {
      printess.nextPage();
    }
    toolbar.appendChild(nextPage);
  }

  page.innerHTML = "Page<br>" + info.current + " of " + info.max;

  toolbar.appendChild(page);

}

function getMobileSelectedProperty(properties: Array<iExternalProperty>): iExternalProperty | null {
  const selectedButton = document.querySelector(".mobile-property-button.selected");
  if (selectedButton) {
    const id = selectedButton.id.split(":")[0];
    const property = properties.filter(p => p.id === id)[0];
    if (property) {
      return property;
    }
  }
  return null;
}


function getMobileButtons(printess: iPrintessApi, properties: Array<iExternalProperty>): HTMLDivElement {
  const container = document.createElement("div");
  container.className = "mobile-buttons-container";

  const scrollContainer = document.createElement("div");
  scrollContainer.className = "mobile-buttons-scroll-container";
  //  window.setTimeout(() => { scrollContainer.scrollLeft = 120 }, 100);

  const buttonContainer = document.createElement("div");
  buttonContainer.className = "mobile-buttons";

  const buttons = printess.getMobileUiButtons(properties);

  for (const b of buttons) {
    const buttonDiv = document.createElement("div");
    buttonDiv.id = (b.newState.externalProperty?.id ?? "") + ":" + (b.newState.metaProperty ?? "");
    buttonDiv.className = printess.isTextButton(b) ? "mobile-property-text" : "mobile-property-button";

    buttonDiv.onclick = (_e: MouseEvent) => {
      document.querySelectorAll(".mobile-property-button").forEach((ele) => ele.classList.remove("selected"));
      document.querySelectorAll(".mobile-property-text").forEach((ele) => ele.classList.remove("selected"));
      buttonDiv.classList.toggle("selected");
      buttonDiv.innerHTML = "";
      drawButtonContent(printess, buttonDiv, properties);

      // render control
      const controlHost = document.getElementById("mobile-control-host");
      if (controlHost) {
        centerMobileButton(buttonDiv);
        controlHost.innerHTML = "";
        if (b.newState.externalProperty) {
          controlHost.appendChild(getPropertyControl(printess, b.newState.externalProperty, b.newState.metaProperty, true));
        }
      }
    }

    drawButtonContent(printess, buttonDiv, properties);

    buttonContainer.appendChild(buttonDiv);

    /*  if ( b === buttons[0]) {
        // center first button
        
        
        window.setTimeout(()=>{
          //centerMobileButton(buttonDiv);
          const scrollContainer = <HTMLDivElement>document.querySelector(".mobile-buttons-scroll-container");
          const mobileUi = <HTMLDivElement>document.querySelector(".mobile-ui");
          if (scrollContainer && mobileUi) {
            scrollContainer.scrollLeft = mobileUi.offsetWidth / 2;
          }
        },0)
      }*/
  }

  scrollContainer.appendChild(buttonContainer);
  container.appendChild(scrollContainer);
  return container;
}



function drawButtonContent(printess: iPrintessApi, buttonDiv: HTMLDivElement, properties: Array<iExternalProperty>) {

  // find property by button id.
  const id = buttonDiv.id.split(":")
  const propertyId = id[0]
  const metaProperty = id[1] ?? ""
  const property = properties.filter(p => p.id === propertyId)[0];
  if (!property) return

  const buttons = printess.getMobileUiButtons([property]);
  let b: iMobileUIButton | undefined = undefined;
  for (const button of buttons) {
    if ((button.newState.metaProperty ?? "") === metaProperty) {
      b = button;
      break;
    }
  }
  if (!b) return;


  const isSelected = buttonDiv.classList.contains("selected");
  buttonDiv.innerHTML = "";

  if (printess.isTextButton(b)) {

    const buttonText = document.createElement("div");
    buttonText.className = "text";
    buttonText.innerText = b.caption;

    const buttonIcon = document.createElement("div");
    buttonIcon.className = "icon";
    buttonIcon.innerText = "T";

    buttonDiv.appendChild(buttonText);
    buttonDiv.appendChild(buttonIcon);


  } else {

    const buttonCircle = getButtonCircle(printess, b, isSelected);

    const buttonText = document.createElement("div");
    buttonText.className = "mobile-property-caption";
    buttonText.innerText = b.caption;

    buttonDiv.appendChild(buttonCircle);
    buttonDiv.appendChild(buttonText);

  }
}

function getButtonCircle(printess: iPrintessApi, m: iMobileUIButton, isSelected: boolean): HTMLDivElement {

  const c = printess.getButtonCircleModel(m, isSelected);

  const circle = document.createElement("div");
  circle.className = "circle-button-graphic";
  if (c.hasSvgCircle) {
    circle.appendChild(getSvgCircle(c.displayGauge, c.gaugeValue));
  }
  if (c.hasImage) {
    const image = document.createElement("div");
    image.classList.add("circular-image");
    if (m.circleStyle) image.setAttribute("style", m.circleStyle);
    if (m.thumbCssUrl) image.style.backgroundImage = m.thumbCssUrl;
    circle.appendChild(image);
  }
  if (c.hasCaption) {
    const caption = document.createElement("div");
    caption.className = c.captionClass;
    caption.innerText = c.captionInCircle;
    circle.appendChild(caption);
  }
  if (c.hasColor) {
    const color = document.createElement("div");
    color.classList.add("circular-color");

    color.style.backgroundColor = c.color;
    color.innerText = c.captionInCircle;
    circle.appendChild(color);
  }
  if (c.hasIcon && c.icon !== "none") {

    const icon = printess.getIcon(c.icon);
    icon.classList.add("circle-button-icon");

    circle.appendChild(icon);
    // `<wc-icon class="circle-button-icon" primaryColor="toolbar" icon="${c.icon}"></wc-icon>
  }
  return circle;
}


function getSvgCircle(displayGauge: boolean, gaugeValue: number): SVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttributeNS(null, "viewBox", "0 0 36 36");
  svg.classList.add("circular-svg");

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.classList.add("circle-bg");
  path.setAttributeNS(null, "d", "M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831");

  svg.appendChild(path);

  if (displayGauge && gaugeValue !== 0) {
    const innerPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    innerPath.classList.add("circle");
    if (gaugeValue < 0) {
      innerPath.setAttributeNS(null, "transform", "scale(-1,1) translate(-36,0)");
    }
    innerPath.setAttributeNS(null, "stroke-dasharray", Math.abs(gaugeValue) + ",100");
    innerPath.setAttributeNS(null, "d", "M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831");
    svg.appendChild(innerPath);
  }
  return svg;
}

function centerMobileButton(buttonDiv: HTMLDivElement): void {

  const eX = buttonDiv.offsetLeft;
  const scrollContainer = <HTMLDivElement>document.querySelector(".mobile-buttons-scroll-container");
  const mobileUi = <HTMLDivElement>document.querySelector(".mobile-ui");
  if (scrollContainer && mobileUi) {
    const vw = mobileUi.offsetWidth;
    scrollToLeft(scrollContainer, eX - vw / 2 + buttonDiv.offsetWidth / 2, 300);
    //container.scrollLeft = eX - vw/2 + ele.offsetWidth / 2;
  }

}

function scrollToLeft(element: HTMLDivElement, to: number, duration: number): void {
  const start = element.scrollLeft;
  const change = to - start;
  let currentTime = 0;
  const increment = 10;

  const animateScroll = function () {
    currentTime += increment;
    const val = easeInOutQuad(currentTime, start, change, duration);
    element.scrollLeft = val;
    if (currentTime < duration) {
      setTimeout(animateScroll, increment);
    }
  };
  animateScroll();
}

//t = current time
//b = start value
//c = change in value
//d = duration
function easeInOutQuad(t: number, b: number, c: number, d: number) {
  t /= d / 2;
  if (t < 1) return c / 2 * t * t + b;
  t--;
  return -c / 2 * (t * (t - 2) - 1) + b;
}



/*
 *   Overlay Callbacks
 */
// TODO get overlay style injection 
function getOverlay(printess: iPrintessApi, properties: Array<iExternalProperty>): HTMLElement {
  console.log("+++++++Properties", properties);
  const isSingleLineText = properties.filter(p => p.kind === "single-line-text").length > 0;
  const isImage = properties.filter(p => p.kind === "image").length > 0;
  const isColor = properties.filter(p => p.kind === "color").length > 0;
  const hdiv = document.createElement("div");
  hdiv.style.border = "10px solid rgba(0,200,100,0.5)";
  hdiv.style.opacity = "1";
  if (isSingleLineText) {
    const tdiv = document.createElement("div");
    tdiv.style.position = "absolute";
    tdiv.style.top = "-38px"
    tdiv.style.left = "10px";
    tdiv.style.fontSize = "16px";
    tdiv.style.backgroundColor = "yellow";
    tdiv.innerText = "TEXT";
    tdiv.style.padding = "4px"
    hdiv.appendChild(tdiv);
  } else if (isImage) {
    const tdiv = document.createElement("div");
    tdiv.style.position = "absolute";
    tdiv.style.top = "-38px"
    tdiv.style.left = "10px";
    tdiv.style.fontSize = "16px";
    tdiv.style.backgroundColor = "lightblue";
    tdiv.innerText = "IMAGE";
    tdiv.style.padding = "4px"
    hdiv.appendChild(tdiv);
  } else if (isColor) {
    const tdiv = document.createElement("div");
    tdiv.style.position = "absolute";
    tdiv.style.top = "-38px"
    tdiv.style.left = "10px";
    tdiv.style.fontSize = "16px";
    tdiv.style.backgroundColor = "pink";
    tdiv.innerText = "COLOR";
    tdiv.style.padding = "4px"
    hdiv.appendChild(tdiv);
  }
  return hdiv;
}


