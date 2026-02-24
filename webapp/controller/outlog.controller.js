sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Filter",
    "com/lh/sapui5/zcrtinlogoutlog/model/formatter",
    "sap/m/MessageBox",
    'sap/m/MessageItem',
    'sap/m/MessageView',
    "sap/m/Dialog",
    'sap/m/Button',
    'sap/m/Bar',
    'sap/ui/core/IconPool',
    "sap/m/Title",
    "sap/m/MessageToast",
    'sap/ui/model/type/String'
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, JSONModel, FilterOperator, Filter, formatter, MessageBox, MessageItem, MessageView, Dialog, Button, Bar, IconPool, Title, MessageToast, TypeString) {
        "use strict";
        var oRouter, oController, oMeterOutlogModel, oResourceBundle, oResponseMessages = [], oRecipient = "";
        return Controller.extend("com.lh.sapui5.zcrtinlogoutlog.controller.outlog", {
            formatter: formatter,
            onInit: function () {
                oController = this;
                oResourceBundle = oController.getOwnerComponent().getModel("i18n").getResourceBundle();
                oMeterOutlogModel = oController.getOwnerComponent().getModel();
                var user = sap.ushell.Container.getUser();
                oRecipient = user.getId();
                oController._fnInitializeModel();
                oMeterOutlogModel.attachBatchRequestSent({}, function () {
                    oController.getView().setBusy(true);
                });
                oMeterOutlogModel.attachBatchRequestCompleted({}, function () {
                    oController.getView().setBusy(false);
                });
                oController._fnGetInitialload();
            },
            _fnInitializeModel: function () {
                var oMinDate = new Date();
                oMinDate.setDate(oMinDate.getDate() - 30);
                oController.getView().setModel(new JSONModel({
                    oCurrentDate: oController.formatter.fnDateFormate(new Date()),
                    oPostingDate: oController.formatter.fnDateFormate(new Date()),
                    oMinPostingDate: oMinDate,
                    FilterParameters: []
                }), "OutLogModel")
            },
            _fnGetInitialload: function () {
                oMeterOutlogModel.read("/MOInitialLoadSet", {
                    urlParameters: { '$expand': 'NavStorageLoc' },
                    success: function (oData, oResponse) {
                        var oResults = oData.results[0];
                        oController.getView().getModel("OutLogModel").setProperty("/Recipient", oRecipient);
                        oController.getView().getModel("OutLogModel").setProperty("/InitialLoad", oResults)
                    }, error: function (oError) {
                        var oMessage;
                        if (oError.responseText.startsWith("<")) {
                            var parser = new DOMParser();
                            var xmlDoc = parser.parseFromString(oError.responseText, "text/xml");
                            oMessage = xmlDoc.getElementsByTagName("message")[0].childNodes[0].nodeValue;
                        } else {
                            var oResponseText = oError.responseText;
                            var sParsedResponse = JSON.parse(oResponseText);
                            oMessage = sParsedResponse.error.message.value
                        }
                        MessageBox.error(oMessage);
                    }
                });
            },

            onSearch: function () {
                var bIsValidated = true,
                    aFilter;
                var bIsValidated = oController._fnValidatefilterParam();
                if (bIsValidated) {
                    var aFilter = oController._fnGetFilterValues();
                    oController._fnGetDeviceDataSet(aFilter);
                }
            },
            _fnGetDeviceDataSet: function (aFilter) {
                oMeterOutlogModel.read("/DeviceDataSet", {
                    filters: aFilter,
                    success: function (oData, oResponse) {
                        var aResults = oData.results;
                        oController.getView().getModel("OutLogModel").setProperty("/DeviceDataSet", aResults);
                        MessageToast.show(oResourceBundle.getText("lhoutlogRecordAddedMsg"));
                    }, error: function (oError) {
                        var oMessage;
                        if (oError.responseText.startsWith("<")) {
                            var parser = new DOMParser();
                            var xmlDoc = parser.parseFromString(oError.responseText, "text/xml");
                            oMessage = xmlDoc.getElementsByTagName("message")[0].childNodes[0].nodeValue;

                        } else {
                            var oResponseText = oError.responseText;
                            var sParsedResponse = JSON.parse(oResponseText);
                            oMessage = sParsedResponse.error.message.value
                        }
                        MessageBox.error(oMessage);
                    }
                });
            },

            onBeforeRebindTable: function (oEvent) {
                var oOutLogModel = oController.getView().getModel("OutLogModel");
                var oBindingParams = oEvent.getParameter("bindingParams");
                oBindingParams.filters = oOutLogModel.getProperty("/FilterParameters");
            },
            _fnValidatefilterParam: function () {
                debugger;
                var oView = oController.getView(), sMsg, sKeyTargetStorLoc, oPostingDate, IsValided = true, isValideFilterRange;
                var oTargetStorLocComboBox = oView.byId('idTargetStorLoc');
                var oOutlogModel = oController.getView().getModel("OutLogModel");

                var aTokensEquipment = oController.getView().byId("idOutlogEquipFrom").getTokens();
                var sEquipFrom = "";
                if (aTokensEquipment.length === 0) {
                    sEquipFrom = this.getView().byId("idOutlogEquipFrom").getValue();
                }
                else if (aTokensEquipment.length > 0) {
                    sEquipFrom = aTokensEquipment[0].getText();
                    sEquipFrom = sEquipFrom.replace("=", "");
                }
                //var sEquipFrom = oOutlogModel.getProperty("/InitialLoad/EquipFrom");
                //var sEquipTo = oOutlogModel.getProperty("/InitialLoad/EquipTo");
                var oPostingDtInput = oView.byId('idPostingDate');
                var oDocDtInput = oView.byId('idHeaderDocDate');
                var oEqipFromInput = oView.byId('idOutlogEquipFrom');
                var sKeyTargetStorLoc = oTargetStorLocComboBox.getSelectedKey()
                var oPostingDate = oPostingDtInput.getDateValue();
                var oDocDate = oDocDtInput.getDateValue();
                // chekc the Equip from is entered or not And Target stor loc
                if (!sKeyTargetStorLoc) {
                    oTargetStorLocComboBox.setValueState("Error");
                    oTargetStorLocComboBox.setValueStateText(oResourceBundle.getText("lhoutlogInvalidEntryMsg"));
                    IsValided = false;
                } else {
                    oTargetStorLocComboBox.setValueState("None");
                    oTargetStorLocComboBox.setValueStateText("");
                }
                if (!sEquipFrom) {
                    oEqipFromInput.setValueState("Error");
                    oEqipFromInput.setValueStateText(oResourceBundle.getText("lhoutlogInvalidEntryMsg"));
                    IsValided = false;
                } else {
                    oEqipFromInput.setValueState("None");
                    oEqipFromInput.setValueStateText("");
                }
                if (!oPostingDate) {
                    oPostingDtInput.setValueState("Error");
                    oPostingDtInput.setValueStateText(oResourceBundle.getText("lhoutlogInvalidEntryMsg"));
                    IsValided = false;
                } else {
                    oPostingDtInput.setValueState("None");
                    oPostingDtInput.setValueStateText("");
                }
                if (!oDocDate) {
                    oDocDtInput.setValueState("Error");
                    oDocDtInput.setValueStateText(oResourceBundle.getText("lhoutlogInvalidEntryMsg"));
                    IsValided = false;
                } else {
                    oDocDtInput.setValueState("None");
                    oDocDtInput.setValueStateText("");
                }
                // isValideFilterRange = Boolean(Number(sEquipTo)) ? Number(sEquipTo) > Number(sEquipFrom) : Boolean(Number(sEquipFrom));
                // if (!isValideFilterRange) {
                //     var oError = oResourceBundle.getText("rangeErrMsg");
                //     MessageBox.error(oError);
                //     IsValided = false
                // }
                return IsValided;
            },
            _fnGetFilterValues: function () {
                var oOutlogModel = oController.getView().getModel("OutLogModel");
                var aFilter = [];
                //var sEquipFrom = oOutlogModel.getProperty("/InitialLoad/EquipFrom");
                //var sEquipTo = oOutlogModel.getProperty("/InitialLoad/EquipTo");

                var sSourStorLoc = oOutlogModel.getProperty("/InitialLoad/StorageLocation");
                var sTargStorLoc = oOutlogModel.getProperty("/InitialLoad/ReceivingStorageLocation");
                var sPlant = oOutlogModel.getProperty("/InitialLoad/Plant");
                var oPostingDate = oOutlogModel.getProperty("/oPostingDate") + "T00:00:00";
                var oDocDate = oOutlogModel.getProperty("/oCurrentDate") + "T00:00:00";
                // var sRecipient = oOutlogModel.getProperty("/InitialLoad/Recipient");
                var sRecipient = oOutlogModel.getProperty("/Recipient");
                var aTokensEquipment = oController.getView().byId("idOutlogEquipFrom").getTokens();
                var sEquipFrom = "";
                if (aTokensEquipment.length === 0) {
                    sEquipFrom = this.getView().byId("idOutlogEquipFrom").getValue();
                    if (sEquipFrom) aFilter.push(new Filter("SerialNumber", FilterOperator.EQ, sEquipFrom));
                }
                else if (aTokensEquipment.length === 1) {
                    sEquipFrom = aTokensEquipment[0].getText();
                    sEquipFrom = sEquipFrom.replace("=", "");
                    aFilter.push(new Filter("SerialNumber", FilterOperator.EQ, sEquipFrom));
                }
                // else if (aTokensEquipment.length === 2) {
                //     let sEquipFrom1 = aTokensEquipment[0].getText();
                //     sEquipFrom1 = sEquipFrom1.replace("=", "");
                //     let sEquipFrom2 = aTokensEquipment[1].getText();
                //     sEquipFrom2 = sEquipFrom2.replace("=", "");
                //     aFilter.push(new Filter("SerialNumber", FilterOperator.BT, sEquipFrom1, sEquipFrom2));
                // }
                else if (aTokensEquipment.length >= 2) {
                    for (let i = 0; i <= aTokensEquipment.length - 1; i++) {
                        sEquipFrom = aTokensEquipment[i].getText();
                        sEquipFrom = sEquipFrom.replace("=", "");
                        aFilter.push(new Filter("SerialNumber", FilterOperator.EQ, sEquipFrom));
                    }
                }
                // var isValideFilterRange = Boolean(Number(sEquipTo)) ? Number(sEquipTo) > Number(sEquipFrom) : Boolean(Number(sEquipFrom));
                // if (isValideFilterRange) {
                //     if (sEquipFrom && sEquipTo) {
                //         aFilter.push(new Filter("SerialNumber", FilterOperator.BT, sEquipFrom, sEquipTo));
                //     } else if (sEquipFrom && !sEquipTo) {
                //         aFilter.push(new Filter("SerialNumber", FilterOperator.EQ, sEquipFrom));
                //     } else if (!sEquipFrom && sEquipTo) {
                //         var oError = oResourceBundle.getText("rangeErrMsg");
                //         MessageBox.error(oError);
                //     } else {
                //         var oError = oResourceBundle.getText("rangeErrMsg");
                //         MessageBox.error(oError);
                //     }
                // }
                aFilter.push(new Filter("StorageLocation", FilterOperator.EQ, sTargStorLoc));
                aFilter.push(new Filter("Plant", FilterOperator.EQ, sPlant));
                aFilter.push(new Filter("PostingDate", FilterOperator.EQ, oPostingDate)); //posting date
                aFilter.push(new Filter("DocumentDate", FilterOperator.EQ, oDocDate));
                aFilter.push(new Filter("Recipient", FilterOperator.EQ, sRecipient));
                return aFilter;
            },
            onPressPostButton: function () {
                var oTable = oController.getView().byId("idDeviceDataSetTable");
                var oModel = oController.getView().getModel("OutLogModel");
                var oTableData = oModel.getProperty("/DeviceDataSet");
                var aSelecedIndices = oTable.getSelectedIndices();
                var bIsLineItemsValidted = oController._fnValidateLineitems(oTableData, aSelecedIndices);
                if (aSelecedIndices.length) {
                    oController._CreateEntries(aSelecedIndices, bIsLineItemsValidted);
                } else {
                    var oMsg = oResourceBundle.getText("lineItemSelInfoMsg");
                    MessageBox.information(oMsg);
                }
            },
            _fnValidateAdjField: function (oSelectedList) {
                var aMessages = [], sMsg,
                    sFlag = oController._fnAdjReadValiation(oSelectedList);
                if (sFlag) {
                    switch (sFlag) {
                        case "E":
                            sMsg = oSelectedList.SerialNumber + "-" + oSelectedList.Message;
                            break;
                        case "S":
                            sMsg = oResourceBundle.getText("adjMeterError", [oSelectedList.SerialNumber]);
                            break;
                    }
                    aMessages.push({
                        type: "Error",
                        title: oResourceBundle.getText("errorMsgTitle"),
                        description: sMsg,
                        subtitle: sMsg,
                        counter: 1
                    });
                }
                // if (oSelectedList.SealDate) {
                //     var sMessageType = oController._fnEquipExpireinOneToTwoYears(oSelectedList.SealDate);
                //     if (sMessageType === "Error") {
                //         aMessages.push({
                //             type: "Error",
                //             title: oResourceBundle.getText("errorMsgTitle"),
                //             description: oResourceBundle.getText("sealdateExpin1YearMsg", [oSelectedList.SerialNumber]),
                //             subtitle: oResourceBundle.getText("sealdateExpin1YearMsg", [oSelectedList.SerialNumber]),
                //             counter: 1
                //         });
                //     }
                //     // else {
                //     //     aMessages.push({
                //     //         type: "Warning",
                //     //         title: oResourceBundle.getText("warningMsgTitle"),
                //     //         description: oResourceBundle.getText("sealdateExpin2YearMsg", [oSelectedList.SerialNumber, oSelectedList.SealDate]),
                //     //         subtitle: oResourceBundle.getText("sealdateExpin2YearMsg", [oSelectedList.SerialNumber, oSelectedList.SealDate]),
                //     //         counter: 1
                //     //     });
                //     // }
                // }
                return aMessages;
            },
            _CreateEntries: function (aSelecedIndices, bIsLineItemsValidted) {
                var oProps = {};
                var oTable = oController.getView().byId("idDeviceDataSetTable");
                var oModel = oController.getView().getModel("OutLogModel");
                var oTableData = oModel.getProperty("/DeviceDataSet");
                var iRecords = aSelecedIndices.length;
                var aSelecedIndices = oTable.getSelectedIndices();
                var sMsg = "";
                if (bIsLineItemsValidted) {
                    aSelecedIndices.map(function (currentValue, index, arr) {
                        var oSelectedList = oTableData[currentValue];
                        oProps.properties = {
                            "SerialNumber": oSelectedList.SerialNumber,
                            "Plant": oSelectedList.Plant,
                            "StorageLocation": oSelectedList.StorageLocation,
                            "Recipient": oSelectedList.Recipient,
                            "DocumentDate": oSelectedList.DocumentDate,
                            "PostingDate": oSelectedList.PostingDate,
                            "MaterialNumber": oSelectedList.MaterialNumber,
                            "MaterialDescription": oSelectedList.MaterialDescription,
                            // "RecvReadKwh": oSelectedList.RecvReadKwh,
                            "AdjRecvReadKwh": oSelectedList.AdjRecvReadKwh,
                            "RecvKwhFlag": oSelectedList.RecvKwhFlag,
                            // "DelvReadKwh": oSelectedList.DelvReadKwh,
                            "AdjDelvReadKwh": oSelectedList.AdjDelvReadKwh,
                            "DelvKwhFlag": oSelectedList.DelvKwhFlag,
                            // "RecvReadKw": oSelectedList.RecvReadKw,
                            // "AdjRecvReadKw": oSelectedList.AdjRecvReadKw,
                            "RecvKwFlag": oSelectedList.RecvKwFlag,
                            // "DelvReadKw": oSelectedList.DelvReadKw,
                            // "AdjDelvReadKw": oSelectedList.AdjDelvReadKw,
                            "DelvKwFlag": oSelectedList.DelvKwFlag,
                            // "RecvReadKva": oSelectedList.RecvReadKva,
                            // "AdjRecvReadKva": oSelectedList.AdjRecvReadKva,
                            "RecvKvaFlag": oSelectedList.RecvKvaFlag,
                            //"DelvReadKva": oSelectedList.DelvReadKva,
                            // "AdjDelvReadKva": oSelectedList.AdjDelvReadKva,
                            "DelvKvaFlag": oSelectedList.DelvKvaFlag,
                            //"ReadDate": "\/Date(1713225600000)\/",
                            "FormNo": oSelectedList.FormNo,
                            "SealDate": oSelectedList.SealDate,
                            "SealExpiry": oSelectedList.SealExpiry,
                            //"OperationNo": oSelectedList.OperationNo,
                            "Message": oSelectedList.Message,
                            "Type": oSelectedList.Type
                        }
                        oProps.success = function (oData, oResponse) {
                            oController._fnMapResponseResults(oData);
                            if (oMeterOutlogModel.hasPendingChanges()) {
                                oMeterOutlogModel.resetChanges();
                            }
                            oController._fnCreateMessageStru(oData);
                            if (iRecords === (index + 1)) {
                                oController._fnoResponseMsgManager(oResponseMessages);
                            }
                        },
                            oProps.error = function (oError) {
                                var oMessage;
                                if (oError.responseText.startsWith("<")) {
                                    var parser = new DOMParser();
                                    var xmlDoc = parser.parseFromString(oError.responseText, "text/xml");
                                    oMessage = xmlDoc.getElementsByTagName("message")[0].childNodes[0].nodeValue;

                                } else {
                                    var oResponseText = oError.responseText;
                                    var sParsedResponse = JSON.parse(oResponseText);
                                    oMessage = sParsedResponse.error.message.value
                                }
                                MessageBox.error(oMessage);
                                if (oMeterOutlogModel.hasPendingChanges()) {
                                    oMeterOutlogModel.resetChanges();
                                }
                            },
                            oProps.refreshAfterChange = true;
                        var oEntry = oMeterOutlogModel.createEntry("/DeviceDataSet", oProps);
                    });
                    var mParameter = {
                    };
                    oMeterOutlogModel.submitChanges("BatchGroupID", mParameter);
                }
            },
            _fnCreateMessageStru: function (oData) {
                var sMsgType;
                switch (oData.Type) {
                    case 'S':
                        sMsgType = "Success"
                        break;
                    case 'W':
                        sMsgType = "Warning"
                        break;
                    case 'E':
                        sMsgType = "Error"
                        break;
                }
                oResponseMessages.push({
                    type: sMsgType,
                    title: "Meter: " + oData.SerialNumber,
                    description: oData.Message,
                    subtitle: oData.Message,
                    counter: 1
                });

            },
            _fnoResponseMsgManager: function (oMessages) {
                var oMessageTemplate = new MessageItem({
                    type: '{type}',
                    title: '{title}',
                    description: '{description}',
                    subtitle: '{subtitle}',
                    counter: '{counter}',
                    markupDescription: '{markupDescription}',
                });
                var oModel = new JSONModel();
                oModel.setData(oMessages);
                this.oMessageView = new MessageView({
                    showDetailsPageHeader: false,
                    itemSelect: function () {
                        oBackButton.setVisible(true);
                    },
                    items: {
                        path: "/",
                        template: oMessageTemplate
                    }
                });

                var oBackButton = new Button({
                    icon: IconPool.getIconURI("nav-back"),
                    visible: false,
                    press: function () {
                        oController.oMessageView.navigateBack();
                        this.setVisible(false);
                    }
                });
                this.oMessageView.setModel(oModel);
                this.oDialog = new Dialog({
                    resizable: true,
                    content: this.oMessageView,
                    state: 'Error',
                    beginButton: new Button({
                        press: function () {
                            oResponseMessages = [];
                            this.getParent().close();
                        },
                        text: "Close"
                    }),
                    customHeader: new Bar({
                        contentLeft: [oBackButton],
                        contentMiddle: [
                            new Title({
                                text: "Message",
                                level: sap.ui.core.TitleLevel.H4
                            })
                        ]
                    }),
                    contentHeight: "50%",
                    contentWidth: "50%",
                    verticalScrolling: false
                });
                this.oDialog.open();
            },
            _fnAdjReadValiation: function (oSelectedList) {
                var sFlagHasError = "";
                if (oSelectedList.Type !== 'E') {
                    // if ((oSelectedList.DelvKvaFlag === 'X' && !Boolean(oSelectedList.AdjDelvReadKva)) ||
                    //     (oSelectedList.DelvKwFlag === 'X' && !Boolean(oSelectedList.AdjDelvReadKw)) ||
                    //     (oSelectedList.DelvKwhFlag === 'X' && !Boolean(oSelectedList.AdjDelvReadKwh)) ||
                    //     (oSelectedList.DelvReadKva === 'X' && !Boolean(oSelectedList.AdjRecvReadKva)) ||
                    //     (oSelectedList.DelvReadKw === 'X' && !Boolean(oSelectedList.AdjRecvReadKw)) ||
                    //     (oSelectedList.DelvReadKwh === 'X' && !Boolean(oSelectedList.AdjRecvReadKwh))) {
                    //     sFlagHasError = "S";
                    // }
                    if ((oSelectedList.DelvKvaFlag === 'X') ||
                        (oSelectedList.DelvKwFlag === 'X') ||
                        (oSelectedList.DelvKwhFlag === 'X' && !Boolean(oSelectedList.AdjDelvReadKwh))) {
                        sFlagHasError = "S";
                    }
                } else {
                    sFlagHasError = "E";
                }
                return sFlagHasError;
            },
            onLiveChangeEqFrom: function (oEvent) {
                var oEqipFromInput = oController.getView().byId('idOutlogEquipFrom');
                var oInput = oEvent.getSource();
                var sValue = oEvent.getParameter('value');
                var updatedValue = formatter.fnReturnNaturalNumber(sValue);
                oInput.setValue(updatedValue);
                oEqipFromInput.setValueState("None");
                oEqipFromInput.setValueStateText("");
            },
            onLiveChangeEqTo: function (oEvent) {
                var oInput = oEvent.getSource();
                var sValue = oEvent.getParameter('value');
                var updatedValue = formatter.fnReturnNaturalNumber(sValue);
                oInput.setValue(updatedValue);
            },
            onChangeTargetStorLoc: function (oEvent) {
                var oTargetLocComboBox = oController.getView().byId('idTargetStorLoc');
                oTargetLocComboBox.setValueState("None");
                oTargetLocComboBox.setValueStateText("");
            },
            _fnMapResponseResults: function (oData) {
                var oTable = oController.getView().byId("idDeviceDataSetTable");
                var oModel = oController.getView().getModel("OutLogModel");
                var oTableData = oModel.getProperty("/DeviceDataSet");
                var aSelecedIndices = oTable.getSelectedIndices();
                aSelecedIndices.map(function (currentValue, index, arr) {
                    var oSelectedList = oTableData[currentValue];
                    if (oSelectedList.SerialNumber === oData.SerialNumber) {
                        oModel.setProperty("/DeviceDataSet/" + currentValue, oData);
                    }
                });
                oModel.refresh();
            },
            _fnEquipExpireinOneToTwoYears: function (oSealDate) {
                var now = new Date();
                var sMessageType = "Success"
                var oneYearFromNow = new Date(now);
                oneYearFromNow.setFullYear(now.getFullYear() + 1);
                var TwoYearFromNow = new Date(now);
                TwoYearFromNow.setFullYear(now.getFullYear() + 2);
                if (oSealDate < oneYearFromNow) {
                    sMessageType = "Error"
                }
                // else if (oSealDate >= oneYearFromNow && oSealDate <= TwoYearFromNow) {
                //     sMessageType = "Warning"
                // }
                return sMessageType;
            },
            _fnValidateLineitems: function (oTableData, aSelecedIndices) {
                var aMessages = [], LineItemavlidated = true;
                aSelecedIndices.map(function (currentValue, index, arr) {
                    var oSelectedList = oTableData[currentValue];
                    var aErrorMessages = oController._fnValidateAdjField(oSelectedList);
                    aMessages.push(...aErrorMessages);
                });
                if (aMessages.length) {
                    oController._fnopenErrorMessage(aMessages);
                }
                return !Boolean(aMessages.length);
            },
            _fnopenErrorMessage: function (oMessages) {
                if (!oController._oDialog) {
                    oController._oDialog = sap.ui.xmlfragment("com.lh.sapui5.zcrtinlogoutlog.fragment.MessageMng", this);
                    oController.getView().addDependent(oController._oDialog);
                }
                oController._fnMessageManager(oMessages);
                this.oMessageView.navigateBack();
                this.oDialog.open();
            },

            _closeDialog: function () {
                oController._oDialog.close();
            },
            _fnMessageManager: function (oMessages) {
                var oMessageTemplate = new MessageItem({
                    type: '{type}',
                    title: '{title}',
                    description: '{description}',
                    subtitle: '{subtitle}',
                    counter: '{counter}',
                    markupDescription: '{markupDescription}',
                });
                var oModel = new JSONModel();
                oModel.setData(oMessages);
                this.oMessageView = new MessageView({
                    showDetailsPageHeader: false,
                    itemSelect: function () {
                        oBackButton.setVisible(true);
                    },
                    items: {
                        path: "/",
                        template: oMessageTemplate
                    }
                });

                var oBackButton = new Button({
                    icon: IconPool.getIconURI("nav-back"),
                    visible: false,
                    press: function () {
                        oController.oMessageView.navigateBack();
                        this.setVisible(false);
                    }
                });

                this.oMessageView.setModel(oModel);

                this.oDialog = new Dialog({
                    resizable: true,
                    content: this.oMessageView,
                    state: 'Error',
                    beginButton: new Button({
                        press: function () {
                            this.getParent().close();
                        },
                        text: "Close"
                    }),
                    customHeader: new Bar({
                        contentLeft: [oBackButton],
                        contentMiddle: [
                            new Title({
                                text: "Error",
                                level: sap.ui.core.TitleLevel.H4
                            })
                        ]
                    }),
                    contentHeight: "50%",
                    contentWidth: "50%",
                    verticalScrolling: false
                });
            },
            onHandleDelete: function (oEvent) {
                var oTable = oController.getView().byId("idDeviceDataSetTable");
                var oModel = oController.getView().getModel("OutLogModel");
                var aTableData = oModel.getProperty("/DeviceDataSet");
                var aSelectedIndices = oTable.getSelectedIndices()
                aTableData = aTableData.filter((value, index) => !aSelectedIndices.includes(index));
                oModel.setProperty("/DeviceDataSet", aTableData);
            },
            onPressCancelButton: function () {
                sap.m.MessageBox.confirm(oResourceBundle.getText("lhOutLogCancelBtnMsg"), {
                    title: "Confirm",
                    onClose: null,
                    styleClass: "",
                    actions: [sap.m.MessageBox.Action.OK,
                    sap.m.MessageBox.Action.CANCEL],
                    emphasizedAction: sap.m.MessageBox.Action.OK,
                    onClose: function (oAction) {
                        if (oAction === "OK") {
                            oController._fnInitializeModel();
                            oController._fnGetInitialload();
                        }
                    }
                });
            },

            onEquipmentVHRequest: function () {
                debugger;
                this._oEquipmentMultiInput = this.byId("idOutlogEquipFrom");
                this.loadFragment({
                    name: "com.lh.sapui5.zcrtinlogoutlog.fragment.oEquipment"
                }).then(function (oDialog) {
                    this._oEquipmentDialog = oDialog;
                    this.getView().addDependent(oDialog);
                    oDialog.setRangeKeyFields([{
                        label: "Equipment",
                        key: "Equipment",
                        type: "string",
                        typeInstance: new TypeString({}, { maxLength: 10 })
                    }]);
                    oDialog.setIncludeRangeOperations([
                        sap.ui.comp.valuehelpdialog.ValueHelpRangeOperation.EQ
                    ], "string");
                    oDialog.setMaxExcludeRanges(0);
                    oDialog.setTokens(this._oEquipmentMultiInput.getTokens());
                    oDialog.open();
                }.bind(this));
            },
            onEquipmentVHOkPress: function (oEvent) {
                var aTokens = oEvent.getParameter("tokens");
                this._oEquipmentMultiInput.setTokens(aTokens);
                this._oEquipmentDialog.close();
            },
            onEquipmentVHCancelPress: function () {
                this._oEquipmentDialog.close();
            },
            onEquipmentVHAfterClose: function () {
                this._oEquipmentDialog.destroy();
            },
        });
    });
