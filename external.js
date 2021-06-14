var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
window.uiHelper = {
    getPropertyControl: getPropertyControl,
    renderGroupSnippets: renderGroupSnippets,
    renderLayoutSnippets: renderLayoutSnippets,
    getOverlay: getOverlay,
    getDoneButton: getDoneButton,
    renderPageNavigation: renderPageNavigationBS,
    renderMobileUi: renderMobileUi,
    getMobileButtons: getMobileButtons,
    renderMobileToolbar: renderMobileToolbar
};
console.log("helpers loaded");
const mobileUiHeight = 220;
const mobileButtonBarHeight = 78;
function getMobilePropertyControl(printess, p, metaProperty) {
    const control = getPropertyControl(printess, p, metaProperty, true);
    return control;
}
function getPropertyControl(printess, p, metaProperty, forMobile = false) {
    switch (p.kind) {
        case "title":
            return getTitle(p);
        case "background-button":
            return getChangeBackgroundButton(printess);
        case "single-line-text":
            return getSingleLineTextBox(printess, p, forMobile);
        case "text-area":
            return getTextArea(printess, p, forMobile);
        case "multi-line-text":
            if (forMobile) {
                switch (metaProperty) {
                    case "text-style-color":
                        return getColorDropDown(printess, p, "color");
                    case "text-style-font":
                        return getFontDropDown(printess, p, true);
                    case "text-style-hAlign":
                        return getHAlignControl(printess, p, true);
                    case "text-style-size":
                        return getFontSizeDropDown(printess, p, true);
                    case "text-style-vAlign":
                        return getVAlignControl(printess, p, true);
                    default:
                        return getMultiLineTextBox(printess, p, forMobile);
                }
            }
            else {
                return getMultiLineTextBox(printess, p, forMobile);
            }
        case "selection-text-style":
            return getTextStyleControl(printess, p);
        case "color":
            return getColorDropDown(printess, p, undefined, forMobile);
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
                            return getNumberSlider(printess, p, metaProperty, true);
                        case "image-scale":
                            return getImageScaleControl(printess, p, true);
                    }
                    const d = document.createElement("div");
                    d.innerText = "Property Control no found";
                    return d;
                }
                else {
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
function getChangeBackgroundButton(printess) {
    const ok = document.createElement("button");
    ok.className = "btn btn-secondary";
    ok.style.alignSelf = "flex-start";
    ok.innerText = "Change Background";
    ok.onclick = () => {
        printess.selectBackground();
    };
    return ok;
}
function getDoneButton(printess) {
    const ok = document.createElement("button");
    ok.className = "btn btn-primary";
    ok.innerText = "Done";
    ok.style.alignSelf = "start";
    ok.style.padding = "5px";
    ok.onclick = () => {
        printess.clearSelection();
    };
    return ok;
}
function getTextStyleControl(printess, p) {
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
function getMultiLineTextBox(printess, p, forMobile) {
    const ta = getTextArea(printess, p, forMobile);
    if (forMobile) {
        return ta;
    }
    else {
        const container = document.createElement("div");
        container.appendChild(getTextStyleControl(printess, p));
        container.appendChild(ta);
        return container;
    }
}
function getSingleLineTextBox(printess, p, forMobile) {
    const inp = document.createElement("input");
    inp.type = "text";
    inp.value = p.value.toString();
    inp.onkeyup = () => {
        printess.setProperty(p.id, inp.value);
        const mobileButtonDiv = document.getElementById(p.id + ":");
        if (mobileButtonDiv) {
            p.value = inp.value;
            drawButtonContent(printess, mobileButtonDiv, [p]);
        }
    };
    inp.onfocus = () => {
        console.warn("INPUT RECEIVES FOCUS");
        printess.focusSelectedItem();
    };
    inp.blur = () => {
        printess.unfocusSelectedItem();
    };
    const r = addLabel(inp, p);
    if (forMobile) {
        r.classList.add("form-control");
    }
    return r;
}
function getTitle(p) {
    const container = document.createElement("div");
    const hr = document.createElement("hr");
    container.appendChild(hr);
    const h1 = document.createElement("h2");
    h1.innerText = p.label;
    container.appendChild(h1);
    container.appendChild(hr);
    return container;
}
function getTextArea(printess, p, forMobile) {
    const inp = document.createElement("textarea");
    inp.value = p.value.toString();
    inp.onkeyup = () => {
        printess.setProperty(p.id, inp.value);
        const mobileButtonDiv = document.getElementById(p.id + ":");
        if (mobileButtonDiv) {
            p.value = inp.value;
            drawButtonContent(printess, mobileButtonDiv, [p]);
        }
    };
    inp.rows = 6;
    if (forMobile) {
        inp.className = "mobile-text-area";
        return inp;
    }
    else {
        inp.className = "desktop-text-area";
        return addLabel(inp, p);
    }
}
function addLabel(input, p, label) {
    input.classList.add("form-control");
    if (!p.label && !label) {
        return input;
    }
    const container = document.createElement("div");
    container.className = "mb-3";
    const htmlLabel = document.createElement("label");
    htmlLabel.className = "form-label";
    htmlLabel.setAttribute("for", "inp" + p.id);
    htmlLabel.innerText = (label || p.label);
    input.id = "inp" + p.id;
    container.appendChild(htmlLabel);
    container.appendChild(input);
    return container;
}
function getImageSelectList(printess, p) {
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
            if (entry.key === p.value)
                thumb.classList.add("selected");
            thumb.onclick = () => {
                printess.setProperty(p.id, entry.key);
                imageList.childNodes.forEach((c) => c.classList.remove("selected"));
                thumb.classList.add("selected");
            };
            imageList.appendChild(thumb);
        }
        container.appendChild(imageList);
    }
    return container;
}
function getColorDropDown(printess, p, metaProperty, forMobile = false, dropdown) {
    if (!dropdown) {
        dropdown = document.createElement("div");
        dropdown.classList.add("btn-group");
    }
    const colors = printess.getColors(p.id);
    const button = document.createElement("button");
    if (!forMobile) {
        button.className = "btn btn-light dropdown-toggle";
        button.dataset.bsToggle = "dropdown";
        button.dataset.bsAutoClose = "true";
        button.setAttribute("aria-expanded", "false");
        if (metaProperty === "color" && p.textStyle) {
            button.style.backgroundColor = p.textStyle.color;
        }
        else {
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
                const mobileButtonDiv = document.getElementById(p.id + ":" + (metaProperty !== null && metaProperty !== void 0 ? metaProperty : ""));
                if (mobileButtonDiv && p.textStyle) {
                    p.textStyle.color = f.color;
                    drawButtonContent(printess, mobileButtonDiv, [p]);
                }
            }
            else {
                printess.setProperty(p.id, f.name);
                p.value = f.color;
                const mobileButtonDiv = document.getElementById(p.id + ":" + (metaProperty !== null && metaProperty !== void 0 ? metaProperty : ""));
                if (mobileButtonDiv) {
                    drawButtonContent(printess, mobileButtonDiv, [p]);
                }
            }
            if (!forMobile)
                button.style.backgroundColor = f.color;
        };
        colorList.appendChild(color);
    }
    if (forMobile) {
        return colorList;
    }
    else {
        ddContent.appendChild(colorList);
        dropdown.appendChild(ddContent);
        return dropdown;
    }
}
function getDropDown(printess, p, asList) {
    var _a;
    const dropdown = document.createElement("div");
    dropdown.classList.add("btn-group");
    const ddContent = document.createElement("ul");
    if (p.listMeta && p.listMeta.list) {
        const selectedItem = (_a = p.listMeta.list.filter(itm => itm.key === p.value)[0]) !== null && _a !== void 0 ? _a : null;
        const button = document.createElement("button");
        button.className = "btn btn-light dropdown-toggle";
        button.dataset.bsToggle = "dropdown";
        button.dataset.bsAutoClose = "true";
        button.setAttribute("aria-expanded", "false");
        if (selectedItem) {
            button.appendChild(getDropdownItemContent(p.listMeta, selectedItem));
        }
        dropdown.appendChild(button);
        if (asList) {
            ddContent.classList.add("list-group");
        }
        else {
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
                        li.classList.add("active");
                    }
                }
            };
            a.appendChild(getDropdownItemContent(p.listMeta, entry));
            li.appendChild(a);
            ddContent.appendChild(li);
        }
        dropdown.appendChild(ddContent);
    }
    if (asList) {
        return ddContent;
    }
    else {
        return dropdown;
    }
}
function getDropdownItemContent(meta, entry) {
    const div = document.createElement("div");
    div.classList.add("dropdown-list-entry");
    if (entry.imageUrl) {
        const img = document.createElement("div");
        img.classList.add("dropdown-list-image");
        img.style.backgroundImage = `url('${entry.imageUrl}')`;
        img.style.width = meta.thumbWidth + "px";
        img.style.height = meta.thumbHeight + "px";
        img.style.marginRight = "10px";
        div.appendChild(img);
    }
    const label = document.createElement("div");
    label.classList.add("dropdown-list-label");
    label.innerText = entry.label;
    div.appendChild(label);
    return div;
}
function getTabPanel(tabs) {
    const panel = document.createElement("div");
    const ul = document.createElement("ul");
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
            a.classList.add("active");
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
            pane.classList.add("show");
            pane.classList.add("active");
        }
        pane.appendChild(t.content);
        content.appendChild(pane);
    }
    panel.appendChild(ul);
    panel.appendChild(content);
    return panel;
}
function getImageFilterControl(printess, p) {
    const container = document.createElement("div");
    container.appendChild(getNumberSlider(printess, p, "image-brightness"));
    container.appendChild(getNumberSlider(printess, p, "image-contrast"));
    container.appendChild(getNumberSlider(printess, p, "image-vivid"));
    container.appendChild(getNumberSlider(printess, p, "image-sepia"));
    return container;
}
function getImageUploadControl(printess, p, container, forMobile = false) {
    var _a;
    container = container || document.createElement("div");
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
    inp.className = "form-control";
    inp.accept = "image/png,image/jpg,image/jpeg";
    inp.multiple = true;
    inp.onchange = () => {
        var _a;
        if (inp && ((_a = inp.files) === null || _a === void 0 ? void 0 : _a.length)) {
            inp.disabled = true;
            inp.style.display = "none";
            if (scaleControl)
                scaleControl.style.display = "none";
            imagePanel.style.display = "none";
            progressDiv.style.display = "flex";
            printess.uploadImages(inp.files, (progress) => {
                progressBar.style.width = (progress * 100) + "%";
            }, true);
        }
    };
    const uploadLabel = document.createElement("label");
    uploadLabel.className = "form-label";
    uploadLabel.innerText = "Upload images form your device";
    uploadLabel.setAttribute("for", p.id);
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
    if ((_a = p.imageMeta) === null || _a === void 0 ? void 0 : _a.thumbCssUrl) {
        mainThumb.className = "main";
        mainThumb.style.backgroundImage = p.imageMeta.thumbCssUrl;
        imagePanel.appendChild(mainThumb);
    }
    for (const im of images) {
        const thumb = document.createElement("div");
        thumb.style.backgroundImage = im.thumbCssUrl;
        if (im.id === p.value)
            thumb.style.border = "2px solid red";
        thumb.onclick = () => {
            printess.setProperty(p.id, im.id);
        };
        imageList.appendChild(thumb);
    }
    imageListWrapper.appendChild(imageList);
    imagePanel.appendChild(imageListWrapper);
    let scaleControl = undefined;
    if (!forMobile) {
        container.appendChild(imagePanel);
        scaleControl = getImageScaleControl(printess, p);
        container.appendChild(scaleControl);
        return container;
    }
    else {
        container.appendChild(imageList);
        return container;
    }
}
function getImageScaleControlOld(printess, p) {
    var _a, _b, _c, _d, _f, _g;
    const scaleRangeLabel = document.createElement("label");
    const scaleRangeLabelCaption = document.createElement("span");
    const scaleRange = document.createElement("input");
    scaleRange.type = "range";
    scaleRange.min = (_b = (_a = p.imageMeta) === null || _a === void 0 ? void 0 : _a.scaleHints.min.toString()) !== null && _b !== void 0 ? _b : "0";
    scaleRange.max = (_d = (_c = p.imageMeta) === null || _c === void 0 ? void 0 : _c.scaleHints.max.toString()) !== null && _d !== void 0 ? _d : "0";
    scaleRange.step = "0.01";
    scaleRange.value = (_g = (_f = p.imageMeta) === null || _f === void 0 ? void 0 : _f.scale.toString()) !== null && _g !== void 0 ? _g : "0";
    scaleRange.oninput = () => {
        const newScale = parseFloat(scaleRange.value);
        printess.setImageMetaProperty(p.id, "scale", newScale);
        if (p.imageMeta) {
            p.imageMeta.scale = newScale;
            scaleRangeLabelCaption.textContent = "Scale(" + Math.floor(p.imageMeta.scaleHints.dpiAtScale1 / newScale) + "dpi)";
            const mobileButtonDiv = document.getElementById(p.id + ":image-scale");
            if (mobileButtonDiv) {
                drawButtonContent(printess, mobileButtonDiv, [p]);
            }
        }
    };
    if (p.imageMeta) {
        scaleRangeLabelCaption.textContent = "Scale(" + Math.floor(p.imageMeta.scaleHints.dpiAtScale1 / p.imageMeta.scale) + "dpi)";
    }
    scaleRangeLabel.style.width = "100%";
    scaleRange.style.width = "80%";
    scaleRangeLabel.appendChild(scaleRangeLabelCaption);
    scaleRangeLabel.appendChild(scaleRange);
    return scaleRangeLabel;
}
function getImageScaleControl(printess, p, forMobile = false) {
    var _a, _b, _c, _d, _f, _g;
    const rangeLabel = document.createElement("label");
    const range = document.createElement("input");
    range.className = "form-range";
    range.type = "range";
    range.min = (_b = (_a = p.imageMeta) === null || _a === void 0 ? void 0 : _a.scaleHints.min.toString()) !== null && _b !== void 0 ? _b : "0";
    range.max = (_d = (_c = p.imageMeta) === null || _c === void 0 ? void 0 : _c.scaleHints.max.toString()) !== null && _d !== void 0 ? _d : "0";
    range.step = "0.01";
    range.value = (_g = (_f = p.imageMeta) === null || _f === void 0 ? void 0 : _f.scale.toString()) !== null && _g !== void 0 ? _g : "0";
    const span = document.createElement("span");
    if (p.imageMeta) {
        span.textContent = "Scale(" + Math.floor(p.imageMeta.scaleHints.dpiAtScale1 / p.imageMeta.scale) + "dpi)";
    }
    rangeLabel.appendChild(span);
    rangeLabel.appendChild(range);
    if (forMobile) {
        rangeLabel.classList.add("form-control");
    }
    range.oninput = () => {
        const newScale = parseFloat(range.value);
        printess.setImageMetaProperty(p.id, "scale", newScale);
        if (p.imageMeta) {
            p.imageMeta.scale = newScale;
            span.textContent = "Scale(" + Math.floor(p.imageMeta.scaleHints.dpiAtScale1 / newScale) + "dpi)";
            const mobileButtonDiv = document.getElementById(p.id + ":image-scale");
            if (mobileButtonDiv) {
                drawButtonContent(printess, mobileButtonDiv, [p]);
            }
        }
    };
    return rangeLabel;
}
function getNumberSlider(printess, p, metaProperty = null, forMobile = false) {
    const ui = printess.getNumberUi(p, metaProperty);
    if (!ui) {
        const er = document.createElement("div");
        er.textContent = "Can't get number UI for " + p.id + " / metaProperty:" + (metaProperty || "");
        return er;
    }
    const rangeLabel = document.createElement("label");
    const range = document.createElement("input");
    range.className = "form-range";
    range.type = "range";
    range.min = ui.meta.min.toString();
    range.max = ui.meta.max.toString();
    range.step = ui.meta.step.toString();
    range.value = ui.value.toString();
    range.oninput = () => {
        printess.setNumberUiProperty(p, metaProperty, parseFloat(range.value));
        const mobileButtonDiv = document.getElementById(p.id + ":" + (metaProperty !== null && metaProperty !== void 0 ? metaProperty : ""));
        if (mobileButtonDiv) {
            drawButtonContent(printess, mobileButtonDiv, [p]);
        }
    };
    const span = document.createElement("span");
    span.textContent = metaProperty ? metaProperty : p.label;
    rangeLabel.appendChild(span);
    rangeLabel.appendChild(range);
    if (forMobile) {
        rangeLabel.classList.add("form-control");
    }
    return rangeLabel;
}
function getFontSizeSelect(printess, p) {
    var _a, _b;
    const select = document.createElement("select");
    select.className = "form-control";
    select.style.width = "60px";
    select.value = (_b = (_a = p.textStyle) === null || _a === void 0 ? void 0 : _a.size) !== null && _b !== void 0 ? _b : "12pt";
    select.onchange = () => {
        printess.setTextStyleProperty(p.id, "size", select.value);
    };
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
function getFontSizeDropDown(printess, p, asList, dropdown) {
    var _a, _b, _c;
    if (!dropdown) {
        dropdown = document.createElement("div");
        dropdown.classList.add("btn-group");
        dropdown.classList.add("form-control");
    }
    dropdown.style.padding = "0";
    const sizes = ["6pt", "7pt", "8pt", "10pt", "12pt", "14pt", "16pt", "20pt", "24pt", "28pt", "32pt", "36pt", "42pt", "48pt", "54pt", "60pt", "66pt", "72pt", "78pt"];
    const ddContent = document.createElement("ul");
    if (p.textStyle && sizes.length) {
        const selectedItem = (_a = sizes.filter(itm => { var _a, _b; return (_b = itm === ((_a = p.textStyle) === null || _a === void 0 ? void 0 : _a.size)) !== null && _b !== void 0 ? _b : "??pt"; })[0]) !== null && _a !== void 0 ? _a : null;
        const button = document.createElement("button");
        button.className = "btn btn-light dropdown-toggle";
        button.dataset.bsToggle = "dropdown";
        button.dataset.bsAutoClose = "true";
        button.setAttribute("aria-expanded", "false");
        if (selectedItem) {
            button.innerText = selectedItem;
        }
        else {
            button.innerText = (_c = (_b = p.textStyle) === null || _b === void 0 ? void 0 : _b.size) !== null && _c !== void 0 ? _c : "??pt";
        }
        dropdown.appendChild(button);
        if (asList) {
            ddContent.classList.add("list-group");
            ddContent.classList.add("list-group-grid-style");
        }
        else {
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
            li.classList.add("dropdown-item");
            li.onclick = () => {
                button.innerHTML = "";
                printess.setTextStyleProperty(p.id, "size", entry);
                if (p.textStyle)
                    p.textStyle.size = entry;
                button.innerText = entry;
                if (asList) {
                    ddContent.querySelectorAll("li").forEach(li => li.classList.remove("active"));
                    li.classList.add("active");
                    const mobileButtonDiv = document.getElementById(p.id + ":text-style-size");
                    if (mobileButtonDiv) {
                        drawButtonContent(printess, mobileButtonDiv, [p]);
                    }
                }
            };
            li.innerText = entry;
            ddContent.appendChild(li);
        }
        dropdown.appendChild(ddContent);
    }
    if (asList) {
        return ddContent;
    }
    else {
        return dropdown;
    }
}
function getFontDropDown(printess, p, asList, dropdown) {
    var _a;
    if (!dropdown) {
        dropdown = document.createElement("div");
        dropdown.classList.add("btn-group");
        dropdown.classList.add("form-control");
    }
    dropdown.style.padding = "0";
    const fonts = printess.getFonts(p.id);
    const ddContent = document.createElement("ul");
    if (p.textStyle && fonts.length) {
        const selectedItem = (_a = fonts.filter(itm => { var _a, _b; return (_b = itm.name === ((_a = p.textStyle) === null || _a === void 0 ? void 0 : _a.font)) !== null && _b !== void 0 ? _b : ""; })[0]) !== null && _a !== void 0 ? _a : null;
        const button = document.createElement("button");
        button.className = "btn btn-light dropdown-toggle";
        button.dataset.bsToggle = "dropdown";
        button.dataset.bsAutoClose = "true";
        button.setAttribute("aria-expanded", "false");
        if (selectedItem) {
            button.appendChild(getDropdownImageContent(selectedItem.thumbUrl));
        }
        dropdown.appendChild(button);
        if (asList) {
            ddContent.classList.add("list-group");
        }
        else {
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
                    const mobileButtonDiv = document.getElementById(p.id + ":text-style-font");
                    if (mobileButtonDiv) {
                        drawButtonContent(printess, mobileButtonDiv, [p]);
                    }
                }
                else {
                    button.innerHTML = "";
                    button.appendChild(getDropdownImageContent(entry.thumbUrl));
                }
            };
            li.appendChild(getDropdownImageContent(entry.thumbUrl));
            ddContent.appendChild(li);
        }
        dropdown.appendChild(ddContent);
    }
    if (asList) {
        return ddContent;
    }
    else {
        return dropdown;
    }
}
function getDropdownImageContent(thumbUrl) {
    const img = document.createElement("img");
    img.src = thumbUrl;
    img.style.height = "20px";
    return img;
}
function getVAlignControl(printess, p, forMobile) {
    const group = document.createElement("div");
    group.className = "btn-group";
    if (forMobile) {
        group.classList.add("form-control");
    }
    for (const v of ["top", "center", "bottom"]) {
        let icon = "align-top";
        switch (v) {
            case "center":
                icon = "align-middle";
                break;
            case "bottom":
                icon = "align-bottom";
                break;
        }
        const id = p.id + "btnVAlignRadio" + v;
        group.appendChild(getRadioButton(printess, p, id, "vAlign", v));
        group.appendChild(getRadioLabel(printess, p, id, "vAlign", icon));
    }
    return group;
}
function getHAlignControl(printess, p, forMobile) {
    const group = document.createElement("div");
    group.className = "btn-group";
    if (forMobile) {
        group.classList.add("form-control");
    }
    for (const v of ["left", "right", "center", "justifyLeft"]) {
        let icon = "text-align-left";
        switch (v) {
            case "right":
                icon = "text-align-right";
                break;
            case "center":
                icon = "text-align-center";
                break;
            case "justifyLeft":
                icon = "text-align-justify-left";
                break;
            case "justifyCenter":
                icon = "text-align-justify-center";
                break;
            case "justifyRight":
                icon = "text-align-justify-right";
                break;
            case "justifyJustify":
                icon = "text-align-justify-justify";
                break;
        }
        const id = p.id + "btnHAlignRadio" + v;
        group.appendChild(getRadioButton(printess, p, id, "hAlign", v));
        group.appendChild(getRadioLabel(printess, p, id, "hAlign", icon));
    }
    return group;
}
function getRadioLabel(printess, p, id, name, icon) {
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
function getRadioButton(printess, p, id, name, value) {
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
        if (p.textStyle)
            p.textStyle[name] = value;
        const mobileButtonDiv = document.getElementById(p.id + ":" + "text-style-" + name);
        if (mobileButtonDiv) {
            drawButtonContent(printess, mobileButtonDiv, [p]);
        }
    };
    return radio;
}
function getFontSizeBox(printess, p) {
    var _a, _b;
    const cp = document.createElement("input");
    cp.type = "text";
    cp.className = "form-control";
    cp.value = (_b = (_a = p.textStyle) === null || _a === void 0 ? void 0 : _a.size) !== null && _b !== void 0 ? _b : "12pt";
    cp.setAttribute("list", "font-size-data-list");
    cp.onchange = () => {
        printess.setTextStyleProperty(p.id, "size", cp.value);
    };
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
function renderPageNavigation(printess, spreads, _properties) {
    console.log("All Spreads", spreads);
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
                };
                pages.appendChild(pageButton);
            }
        }
    }
}
function getPaginationItem(printess, content, spread, page) {
    const li = document.createElement("li");
    li.className = "page-item";
    const a = document.createElement("li");
    a.className = "page-link";
    if (typeof content === "number") {
        a.innerText = spread.name ? spread.name : content.toString();
    }
    else if (content === "previous") {
        a.innerText = "&laquo";
    }
    else if (content === "next") {
        a.innerText = "&raquo";
    }
    li.appendChild(a);
    if ((page === "left-page" && spread.pages === 1) || (page === "right-page" && spread.pages === 2)) {
        li.classList.add("me-2");
    }
    li.onclick = () => {
        printess.selectSpread(spread.index, page);
    };
    return li;
}
function renderPageNavigationBS(printess, spreads, _properties) {
    console.log("All Spreads", spreads);
    const pages = document.querySelector(".page-buttons");
    if (pages) {
        let pageNo = 0;
        pages.innerHTML = "";
        const ul = document.createElement("ul");
        ul.className = "pagination";
        if (spreads.length > 1) {
            for (const spread of spreads) {
                for (let pageIndex = 0; pageIndex < spread.pages; pageIndex++) {
                    pageNo++;
                    const page = pageIndex === 0 ? "left-page" : "right-page";
                    ul.appendChild(getPaginationItem(printess, pageNo, spread, page));
                }
            }
        }
        pages.appendChild(ul);
    }
}
function renderGroupSnippets(printess, groupSnippets, forMobile) {
    const div = document.createElement("div");
    div.className = "group-snippets";
    if (groupSnippets.length > 0) {
        for (const cluster of groupSnippets) {
            const headline = document.createElement("h5");
            headline.className = "snippet-cluster-name";
            headline.textContent = cluster.name;
            div.appendChild(headline);
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
                thumb.onclick = () => {
                    if (forMobile) {
                        div.innerHTML === "";
                    }
                    printess.insertGroupSnippet(snippet.snippetUrl);
                };
                div.appendChild(thumb);
            }
        }
    }
    if (forMobile) {
        const mobile = document.createElement("div");
        mobile.className = "mobile-group-snippets-container";
        mobile.appendChild(div);
        return mobile;
    }
    else {
        return div;
    }
}
function renderLayoutSnippets(printess, layoutSnippets) {
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
            container.appendChild(headline);
            const clusterDiv = document.createElement("div");
            clusterDiv.className = "layout-snippet-cluster";
            for (const snippet of cluster.snippets) {
                const thumb = document.createElement("img");
                thumb.src = snippet.thumbUrl;
                thumb.classList.add("layout-snippet-icon");
                thumb.onclick = () => {
                    printess.insertLayoutSnippet(snippet.snippetUrl);
                    const myOffcanvas = document.getElementById("closeLayoutOffCanvas");
                    if (myOffcanvas)
                        myOffcanvas.click();
                    const offCanvas = document.getElementById("layoutOffcanvas");
                    if (offCanvas)
                        offCanvas.style.visibility = "hidden";
                };
                clusterDiv.appendChild(thumb);
            }
            container.appendChild(clusterDiv);
        }
    }
    return container;
}
function getMobileUiDiv() {
    let mobileUi = document.querySelector(".mobile-ui");
    if (!mobileUi) {
        mobileUi = document.createElement("div");
        mobileUi.className = "mobile-ui";
        document.body.appendChild(mobileUi);
    }
    return mobileUi;
}
function renderMobileUi(printess, properties, state, groupSnippets) {
    const mobileUi = getMobileUiDiv();
    mobileUi.innerHTML = "";
    if (state === "add") {
        const snippets = renderGroupSnippets(printess, groupSnippets, true);
        mobileUi.appendChild(snippets);
    }
    else {
        mobileUi.appendChild(getMobileButtons(printess, properties));
        const controlHost = document.createElement("div");
        controlHost.className = "mobile-control-host";
        controlHost.id = "mobile-control-host";
        mobileUi.appendChild(controlHost);
    }
    if (groupSnippets.length > 0 && state !== "add") {
        mobileUi.appendChild(getMobilePlusButton(printess, properties, groupSnippets));
    }
    if (state !== "document") {
        mobileUi.appendChild(getMobileBackButton(printess, properties, state, groupSnippets));
    }
    resizeMobileUi(printess);
}
function getMobilePlusButton(printess, properties, groupSnippets) {
    const button = document.createElement("div");
    button.className = "mobile-property-plus-button";
    const circle = document.createElement("div");
    circle.className = "mobile-property-circle";
    circle.onclick = () => {
        renderMobileUi(printess, properties, "add", groupSnippets);
    };
    const icon = printess.getIcon("plus");
    circle.appendChild(icon);
    button.appendChild(circle);
    return button;
}
function getMobileBackButton(printess, properties, state, groupSnippets) {
    const button = document.createElement("div");
    button.className = "mobile-property-back-button";
    const circle = document.createElement("div");
    circle.className = "mobile-property-circle";
    circle.onclick = () => {
        if (state === "frames") {
            printess.clearSelection();
        }
        else if (state === "add") {
            renderMobileUi(printess, properties, "document", groupSnippets);
        }
    };
    const icon = printess.getIcon("arrow-left");
    circle.appendChild(icon);
    button.appendChild(circle);
    return button;
}
function renderMobileToolbar(printess) {
    return __awaiter(this, void 0, void 0, function* () {
        let toolbar = document.querySelector(".mobile-toolbar");
        if (!toolbar) {
            toolbar = document.createElement("div");
            toolbar.className = "mobile-toolbar";
            document.body.appendChild(toolbar);
        }
        else {
            toolbar.innerHTML = "";
        }
        const info = yield printess.pageInfo();
        const page = document.createElement("div");
        page.className = "mobile-toolbar-page-info";
        if (!info.isFirst) {
            const previousPage = printess.getIcon("arrow-left");
            previousPage.classList.add("mobile-toolbar-page-previous");
            previousPage.onclick = () => {
                printess.previousPage();
            };
            toolbar.appendChild(previousPage);
        }
        if (!info.isLast) {
            const nextPage = printess.getIcon("arrow-right");
            nextPage.classList.add("mobile-toolbar-page-next");
            nextPage.onclick = () => {
                printess.nextPage();
            };
            toolbar.appendChild(nextPage);
        }
        page.innerHTML = "Page<br>" + info.current + " of " + info.max;
        toolbar.appendChild(page);
    });
}
function getMobileSelectedProperty(properties) {
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
function resizeMobileUi(printess) {
    const mobileUi = getMobileUiDiv();
    const controlHost = document.getElementById("mobile-control-host");
    if (mobileUi && controlHost) {
        const control = controlHost.children[0];
        const usedHeight = control ? control.offsetHeight : 0;
        mobileUi.style.height = (mobileButtonBarHeight + usedHeight) + "px";
        const printessDiv = document.getElementById("printessin");
        if (printessDiv) {
            printessDiv.style.bottom = (mobileButtonBarHeight + usedHeight) + "px";
            printess.resizePrintess();
        }
    }
}
function getMobileButtons(printess, properties) {
    var _a, _b, _c;
    const container = document.createElement("div");
    container.className = "mobile-buttons-container";
    const scrollContainer = document.createElement("div");
    scrollContainer.className = "mobile-buttons-scroll-container";
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "mobile-buttons";
    const buttons = printess.getMobileUiButtons(properties);
    for (const b of buttons) {
        const buttonDiv = document.createElement("div");
        buttonDiv.id = ((_b = (_a = b.newState.externalProperty) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : "") + ":" + ((_c = b.newState.metaProperty) !== null && _c !== void 0 ? _c : "");
        buttonDiv.className = printess.isTextButton(b) ? "mobile-property-text" : "mobile-property-button";
        buttonDiv.onclick = (_e) => {
            document.querySelectorAll(".mobile-property-button").forEach((ele) => ele.classList.remove("selected"));
            document.querySelectorAll(".mobile-property-text").forEach((ele) => ele.classList.remove("selected"));
            buttonDiv.classList.toggle("selected");
            buttonDiv.innerHTML = "";
            drawButtonContent(printess, buttonDiv, properties);
            const controlHost = document.getElementById("mobile-control-host");
            if (controlHost) {
                centerMobileButton(buttonDiv);
                controlHost.innerHTML = "";
                if (b.newState.externalProperty) {
                    const control = getPropertyControl(printess, b.newState.externalProperty, b.newState.metaProperty, true);
                    controlHost.appendChild(control);
                    resizeMobileUi(printess);
                }
            }
        };
        drawButtonContent(printess, buttonDiv, properties);
        buttonContainer.appendChild(buttonDiv);
    }
    scrollContainer.appendChild(buttonContainer);
    container.appendChild(scrollContainer);
    return container;
}
function drawButtonContent(printess, buttonDiv, properties) {
    var _a, _b;
    const id = buttonDiv.id.split(":");
    const propertyId = id[0];
    const metaProperty = (_a = id[1]) !== null && _a !== void 0 ? _a : "";
    const property = properties.filter(p => p.id === propertyId)[0];
    if (!property)
        return;
    const buttons = printess.getMobileUiButtons([property]);
    let b = undefined;
    for (const button of buttons) {
        if (((_b = button.newState.metaProperty) !== null && _b !== void 0 ? _b : "") === metaProperty) {
            b = button;
            break;
        }
    }
    if (!b)
        return;
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
    }
    else {
        const buttonCircle = getButtonCircle(printess, b, isSelected);
        const buttonText = document.createElement("div");
        buttonText.className = "mobile-property-caption";
        buttonText.innerText = b.caption;
        buttonDiv.appendChild(buttonCircle);
        buttonDiv.appendChild(buttonText);
    }
}
function getButtonCircle(printess, m, isSelected) {
    const c = printess.getButtonCircleModel(m, isSelected);
    const circle = document.createElement("div");
    circle.className = "circle-button-graphic";
    if (c.hasSvgCircle) {
        circle.appendChild(getSvgCircle(c.displayGauge, c.gaugeValue));
    }
    if (c.hasImage) {
        const image = document.createElement("div");
        image.classList.add("circular-image");
        if (m.circleStyle)
            image.setAttribute("style", m.circleStyle);
        if (m.thumbCssUrl)
            image.style.backgroundImage = m.thumbCssUrl;
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
    }
    return circle;
}
function getSvgCircle(displayGauge, gaugeValue) {
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
function centerMobileButton(buttonDiv) {
    const eX = buttonDiv.offsetLeft;
    const scrollContainer = document.querySelector(".mobile-buttons-scroll-container");
    const mobileUi = document.querySelector(".mobile-ui");
    if (scrollContainer && mobileUi) {
        const vw = mobileUi.offsetWidth;
        scrollToLeft(scrollContainer, eX - vw / 2 + buttonDiv.offsetWidth / 2, 300);
    }
}
function scrollToLeft(element, to, duration) {
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
function easeInOutQuad(t, b, c, d) {
    t /= d / 2;
    if (t < 1)
        return c / 2 * t * t + b;
    t--;
    return -c / 2 * (t * (t - 2) - 1) + b;
}
function getOverlay(printess, properties) {
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
        tdiv.style.top = "-38px";
        tdiv.style.left = "10px";
        tdiv.style.fontSize = "16px";
        tdiv.style.backgroundColor = "yellow";
        tdiv.innerText = "TEXT";
        tdiv.style.padding = "4px";
        hdiv.appendChild(tdiv);
    }
    else if (isImage) {
        const tdiv = document.createElement("div");
        tdiv.style.position = "absolute";
        tdiv.style.top = "-38px";
        tdiv.style.left = "10px";
        tdiv.style.fontSize = "16px";
        tdiv.style.backgroundColor = "lightblue";
        tdiv.innerText = "IMAGE";
        tdiv.style.padding = "4px";
        hdiv.appendChild(tdiv);
    }
    else if (isColor) {
        const tdiv = document.createElement("div");
        tdiv.style.position = "absolute";
        tdiv.style.top = "-38px";
        tdiv.style.left = "10px";
        tdiv.style.fontSize = "16px";
        tdiv.style.backgroundColor = "pink";
        tdiv.innerText = "COLOR";
        tdiv.style.padding = "4px";
        hdiv.appendChild(tdiv);
    }
    return hdiv;
}
//# sourceMappingURL=getting-started-external.js.map