sap.ui.define([
    "sap/ui/core/mvc/Controller"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller) {
        "use strict";
        var oRouter, oController;
        return Controller.extend("com.lh.sapui5.zcrtinlogoutlog.controller.selection", {
            onInit: function () {
                oController = this;
                oRouter = oController.getOwnerComponent().getRouter();
            },
            onPressOutlog: function () {
                oRouter.navTo("CreateOutlog");
            },
            onPressInlog:function(){
                oRouter.navTo("CreateInlog");
            }
        });
    });
