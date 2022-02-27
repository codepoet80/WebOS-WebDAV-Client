enyo.kind({
    name: "WebDavClient",
    kind: enyo.VFlexBox,

    dirListData: [], // Das JSON Data Array für die Datei und Verzeichnisliste

    // Die WebDav Api  
    davReq: new davApi(),
    // Der Aktuell ausgewaehlte Server   
    currentServer: [],
    // Das aktuell ausgwaehlte Datei Object   
    currentItem: "",
    // Das aktuelle Verzeichnis
    currentPath: "/",
    // Das Verzeichnis in dem die ausgewaehlte Datei gespeichert wird
    targetDir: "/media/internal/downloads",
    // Kennung ob die heruntergeladene Datei auch geöffnet werden soll       
    fileOpen: false,
    // Aktuelles Download ticket
    downloadTicket: null,
    // Mit Server verbunden
    connected: false,
    // Server konfiguration ändern
    changeServer: false,
    lastServer: null,

    db: null,

    components: [
        { kind: "ApplicationEvents", onLoad: "initializeWebDavClient" },
        { kind: "AppMenu", components: [
            { caption: "About", onclick: "showAboutMessage" }
        ]},
        { kind: "SlidingPane", multiView: true, flex: 1, components: [ 
            {name: "panelServers", width: "250px", components: [
                // Linker Abschnitt    
                { kind: "Header", name: "ServerHeader", className: "enyo-header-dark", style: "height:60px;", components: [
                    { kind: enyo.VFlexBox, content: "WebDav Servers", flex: 1 },
                ]},
                { kind: "Scroller", flex: 1, components: [
                    { kind: "VFlexBox", align: "left", components: [
                        { name: "serverList", kind: "VirtualRepeater", flex: 1, onSetupRow: "renderServerListItem", components: [
                            // Server Liste
                            { name: "serverItem", kind: "Item", layoutKind: "HFlexLayout", onclick: "btnClickConnectServer", onConfirm: "deleteServerListItem", components: [
                                { name: "captionServer", flex: 1 }
                            ]}
                        ]}
                    ]}
                ]},
                { kind: "Spacer" },
                { kind: "Toolbar", name: "ServerToolbar", components: [
                    { kind: "ToolButton", name: "btnAddServer", icon: "images/add.png", onclick: "btnClickShowAddServerDialog" },
                    { kind: "ToolButton", icon: "images/configure.png", onclick: "btnClickOpenServerConfigure" },
                ]},
            ]},
            // Rechter Abschnitt
            {name: "panelListing", name: "Navigator", components: [
                { kind: "PageHeader", style: "height:60px;", className: "enyo-header-dark", components: [
                    { kind: enyo.VFlexBox, content: "Navigator", flex: 1 },
                    { kind: "Spinner", name: "spinner" },
                ]},
                // NOTE: the scroller has flex set to 1
                { kind: "Scroller", name: "dirListScroller", flex: 1, components: [
                    //{ kind: "VFlexBox", flex: 1, align: "left", components: [
                        { kind: "VirtualRepeater", /*kind: enyo.VirtualList,*/ name: "dirList", flex: 1, onSetupRow: "renderDirListItem", components: [
                            { kind: "Item", layoutKind: "HFlexLayout", name: "dirItem", style: "height:45px", onclick: "btnClickOpenDirFile", onConfirm: "deleteDirListItem", components: [
                                { kind: "Image", name: "dirIcon", style: "height:32px;witdh:32px;", onerror:"iconError"},
                                { kind: "VFlexBox", align: "left", components: [
                                    { name: "captionDir", style: "font-size:13px;font-weight:bold;" },
                                    { name: "captionMeta", style: "font-size:10px;font-style:italic;padding-top:1px;" }
                                ]}
                            ]}
                        ]}
                    //]}
                ]},
                { kind: "Toolbar", components: [
                    { kind: "GrabButton" },
                    { kind: "HFlexBox", components: [
                        { kind: "ToolButton", icon: "images/back.png", onclick: "btnClickDirListBack" },
                        { kind: "ToolButton", icon: "images/refresh.png", onclick: "btnClickRefreshNavigator" },
                        //{ kind: "ToolButton", icon: "images/document-new.png", onclick: "btnClickShowUploadFilePicker" },
                        //{ kind: "ToolButton", icon: "images/folder-new.png", onclick: "btnClickShowNewFolderDialog" }
                    ]}
                ]}
            ]}
        ]},
        // Add Server Dialog
        { kind: "ModalDialog", name: "addServerDialog", onOpen: "addServerDialogOpen", components: [
            { kind: "Scroller", name: "scrollerServerSetup", height: "360px", components: [
                { kind: "RowGroup", caption: "Add new WebDAV Server", components: [
                    { kind: "VFlexBox", align: "left", style: "padding: 0px", components: [
                        { kind: "Input", name: "itemName", spellcheck: false, autoWordComplete: false, hint: "Display Name" },
                        { kind: "CustomListSelector", name: "protocol", style: "padding-left:10px;", onChange: "protocolChanged", value: "http", items: [
                            { caption: "HTTP", value: "http" },
                            { caption: "HTTPS", value: "https" }
                        ]},
                        { kind: "Input", name: "port", spellcheck: false, autoWordComplete: false, hint: "Port" },
                        { kind: "Input", name: "servername", disabled: false, spellcheck: false, autoWordComplete: false, autoCapitalize: "lowercase", hint: "Server Name" },
                        { kind: "Input", name: "serverpath", disabled: false, spellcheck: false, autoWordComplete: false, autoCapitalize: "lowercase", hint: "Server Path (optional)" },
                        { kind: "Input", name: "username", spellcheck: false, autoWordComplete: false, autoCapitalize: "lowercase", hint: "Username" },
                        { kind: "PasswordInput", name: "password", spellcheck: false, autoWordComplete: false, hint: "Password" },
                    ]}
                ]},
                { kind: "HFlexBox", align: "middle", components: [
                    { kind: "Button", flex: 1, caption: "Save", onclick: "btnClickSaveAddServerDialog" },
                    { kind: "Button", flex: 1, caption: "Close", onclick: "btnClickCloseAddServerDialog" }
                ]}
            ]}
        ]},
        // Message Dialog fuer jegliche Art von Meldungen
        { name: "infoMessageDialog", kind: "ModalDialog", style: "width:400px", components: [{
            kind: "VFlexBox", align: "center", style: "padding: 5px", components: [
                { name: "infoMessage", style: "font-weight:bold;font-size:13px;" },
                { kind: "Button", flex: 1, caption: "OK", onclick: "btnClickCloseInfoMessageDialog" }
            ]}
        ]},
        // Message Dialog fuer Datei aktionen (oeffnen oder downloaden)
        { name: "fileActionDialog", kind: "ModalDialog", style: "width:400px", components: [
            { kind: "VFlexBox", align: "left", style: "align:right", components: [
                { kind: "RowGroup", caption: "File Action", components: [
                    { kind: "VFlexBox", align: "left", components: [
                        { name: "fileName", style: "font-weight:bold;font-size:13px;" },
                        { name: "fileCreationDate", style: "font-size:13px;" },
                        { name: "fileLastModified", style: "font-size:13px;" },
                        { name: "fileContentType", style: "font-size:13px;" }
                    ]}
                ]}
            ]},
            { kind: "ProgressBar", name: "fileDownloadProgressBar", minimum: 0, maximum: 100, position: 1 },
            { kind: "HFlexBox", align: "right", style: "padding: 5px", components: [
                { name: "buttonOpenFile", kind: "Button", flex: 1, caption: "Open", onclick: "btnClickOpenFile" },
                { name: "buttonDownloadFile", kind: "Button", flex: 1, caption: "Download", onclick: "btnClickDownloadFile" },
                { name: "buttonCancelFile", kind: "Button", flex: 1, caption: "Close", onclick: "btnClickCloseFileActionDialog" }
            ]}
        ]},
        // Message Dialog fuer das Anlegen eines neuen Verzeichnisses
        { kind: "ModalDialog", name: "createFolderDialog", style: "width:400px", components: [
            { kind: "VFlexBox", align: "left", style: "align:right", components: [
                { kind: "RowGroup", caption: "Create Folder", components: [
                    { kind: "VFlexBox", align: "left", components: [
                        { name: "folderName", kind: "Input", hint: "Folder Name" },
                    ]}
                ]}
            ]},
            { kind: "HFlexBox", align: "right", style: "padding: 5px", components: [
                { kind: "Button", flex: 1, caption: "Create", onclick: "btnClickCreateNewFolder" },
                { kind: "Button", flex: 1, caption: "Cancel", onclick: "btnClickCloseCreateFolderDialog" }
            ]}
        ]},
        { kind: "FilePicker", name: "uploadFilePicker", onPickFile: "uploadFilePickerResponse" },

        // Palm Service Calls                                   
        { name: "fileDownload", kind: "PalmService", service: "palm://com.palm.downloadmanager/", method: "download", onSuccess: "downloadFileResponse", subscribe: true },
        { name: "fileDownloadCancel", kind: "PalmService", service: "palm://com.palm.downloadmanager/", method: "cancelDownload", onSuccess: "cancelFileSuccess", onFailure: "cancelFileFailure" },
        { name: "fileOpen", kind: "PalmService", service: "palm://com.palm.applicationManager/", method: "open", onSuccess: "downloadFileResponse", subscribe: true },
        { name: "fileSend", kind: "PalmService", service: "palm://com.aventer.webdavclientlite.service/", method: "sendfile", onSuccess: "sendFileSuccess", onFailure: "sendFileFailure" },

        { name: "myUpdater", kind: "Helpers.Updater" }
    ],

    // Daten der angelegten Server (Format: JSON)
    serverData: [],

    // Programmstart  
    initializeWebDavClient: function(inSender) {
        //this.resizeLayout();
        // Konfiguration Laden. Wenn die DB noch nicht existiert, wird diese erstellt
        this.$.spinner.show();
        
        this.$.myUpdater.CheckForUpdate(this, "WebDAV Client HD");
        this.environment = enyo.fetchDeviceInfo();
        window.setTimeout(this.startupDB.bind(this), 500);
    },

    startupDB: function() {
        this.db = openDatabase('WebDavDB', '0.2', 'WebDAV Data Store', 2000);
        if (this.db) {
            this.nullHandleCount = 0;
            // Tabelle erstellen, sofern diese noch nicht existiert
            var sqlString = "CREATE TABLE IF NOT EXISTS serverliste (servername TEXT, serverpath TEXT, name TEXT, username TEXT, password TEXT, protocol TEXT, port TEXT);";
            enyo.log("Writing to DB8 with sql string: " + sqlString);
            this.db.transaction(enyo.bind(this, (function(transaction) { transaction.executeSql(sqlString, [], enyo.bind(this, this.firstInitDBFinish), enyo.bind(this, this.showErrorInInfoMessage)); })));
        }
    },

    // Handler fuer das erstmalige anlegen der DB  
    firstInitDBFinish: function(transaction, results) {
        // Serverliste laden
        sqlString = "select * from serverliste";
        enyo.log("Reading from DB8 with sql string: " + sqlString);
        this.db.transaction(enyo.bind(this, (function(transaction) { 
            transaction.executeSql(sqlString, [], enyo.bind(this, this.loadServerListFromDB), enyo.bind(this, this.showErrorInInfoMessage)); 
        })));  
    },

    // Handler fuer das auswerten der Serverlist Laden query  
    loadServerListFromDB: function(transaction, results) {
        enyo.log("loading server list from DB");
        for (var i = 0; i < results.rows.length; i++) {
            var row = results.rows.item(i);
            this.serverData.push({ servername: row.servername, serverpath: row.serverpath, name: row.name, username: row.username, password: row.password, protocol: row.protocol, port: row.port });
        }
        // Serverliste neuladen
        this.$.serverList.render();
    },

    selectNextView: function () {
		//if (this.environment && this.environment.modelName.toLowerCase() != "touchpad") {
			var pane    = this.$.slidingPane;
			var viewIdx = pane.getViewIndex();
			if (viewIdx < pane.views.length - 1) {
				viewIdx = viewIdx + 1;
			} else {
				return;	// we've selected the last available view.
			}
			pane.selectViewByIndex(viewIdx);
		//}
	},

    /* ********************** CONFIGURE SERVER *************************** */
    /*
     * Server konfigurations Mode aktivieren
     */
    btnClickOpenServerConfigure: function() {
        if (!this.changeServer) {
            this.$.ServerToolbar.setStyle("-webkit-box-pack:center;-webkit-box-align:center;background-color:#3388DD");
            this.$.ServerHeader.setStyle("height:60px;-webkit-box-pack:start;-webkit-box-align:stretch;background-color:#3388DD");
            this.changeServer = true;
            this.$.btnAddServer.disabled = true;
        } else {
            this.$.ServerToolbar.setStyle("-webkit-box-pack:center;-webkit-box-align:center;background-color:#343434");
            this.$.ServerHeader.setStyle("height:60px;-webkit-box-pack:start;-webkit-box-align:stretch;background-color:#CCCCCC");
            this.changeServer = false;
            this.$.btnAddServer.disabled = false;
        }
    },

    /* ************************* APP MENU ******************************** */
    openAbout: function() {
        this.$.fileOpen.call({ target: "http://www.aventer.biz/13-0-WebDAV-Client-HD.html" });
    },

    /* *********************** Datei Hochladen *************************** */

    // Filepicker Dialog anzeigen
    btnClickShowUploadFilePicker: function(inSender, inIndex) {
        if (this.connected) {
            this.$.uploadFilePicker.pickFile();
        }
    },

    // Ausgewaehlte Datei einlesen
    uploadFilePickerResponse: function(inSender, inFile) {
        if (inFile !== 'undefined') {
            var filename = inFile[0].fullPath.split("/");
            this.$.fileSend.call({
                sourceFile: inFile[0].fullPath,
                username: this.currentServer.username,
                password: this.currentServer.password,
                protocol: this.currentServer.protocol,
                server: this.currentServer.servername,
                serverpath: this.currentServer.serverpath,
                port: this.currentServer.port,
                path: encodeURI(this.currentPath + "/" + filename[filename.length - 1])
            });
        }
    },

    // Datei wurde erfolgreich eingelesen und soll nun hochgeladen werden
    sendFileSuccess: function(inSender, inResponse) {
        this.$.spinner.show();
        if (inResponse.finish !== 'undefined') {
            if (inResponse.finish) {
                this.$.dirList.render();
            }
        }
    },

    // Datei wurde erfolgreich eingelesen und soll nun hochgeladen werden
    sendFileFailure: function(inSender, inResponse) {
        if (inResponse.error !== 'undefined') {
            if (inResponse.error) {
                this.$.spinner.hide();
                this.showInfoMessage("Error: " + inResponse.errorText);
            }
        }
    },

    /* *************** Neues Verzeichnis Anlegen Dialog ****************** */

    // Neues Verzeichnis anlegen
    btnClickCreateNewFolder: function() {
        // Verzeichnis nur anlegen, wenn ein Name angegeben wurde
        if (this.$.folderName.getValue()) {
            this.$.spinner.show();
            // Verzeichnis erstellen			
            this.davReq.createDir(this.currentPath + "/" + this.$.folderName.getValue(), getCreateFolderRequest);

            this.$.folderName.setValue("");
            this.$.dirList.render();
            this.$.createFolderDialog.close();
        }
    },

    // Anzeigen des "neuen Verzeichnis anlegen" Dialoges
    btnClickShowNewFolderDialog: function(inSender, inIndex) {
        if (this.connected) {
            this.$.createFolderDialog.openAtCenter();
        }
    },

    // Schliessen des "neues Verzeichnis anlegen" Dialoges ohne zu speichern 
    btnClickCloseCreateFolderDialog: function(inSender, inIndex) {
        this.$.folderName.setValue("");
        this.$.createFolderDialog.close();
    },


    /* *************** File Dialog bezogene Aktionen **************** */

    /* File Dialog Oeffnen
       -------------------------------------------------
       
       Uebergabeparameter:
       		item : ist JSON Object im Format {path:, filename:, creationdate:, lastmodified:, contenttype:}
       		
    */
    showFileActionDialog: function(item) {
        // FileAction Dialog oeffnen	
        this.$.fileActionDialog.openAtCenter();

        // Progressbar nicht anzeigen
        this.$.fileDownloadProgressBar.hide();

        // Die Felder Innerhalb des Dialogs beschreiben
        enyo.log("Selected item data: " + (new XMLSerializer()).serializeToString(item.fulldata));
        this.$.fileName.setContent("Filename: " + item.filename);
        this.$.fileCreationDate.setContent("Creation Date: " + item.creationdate);
        this.$.fileLastModified.setContent("Last Modified: " + item.lastmodified);
        this.$.fileContentType.setContent("Content Type: " + item.contenttype);

        this.$.buttonOpenFile.setState("disabled", false);
        this.$.buttonDownloadFile.setState("disabled", false);
        this.$.buttonCancelFile.setContent("Close");

        this.$.fileDownloadProgressBar.hide();
        this.$.fileDownloadProgressBar.setPosition(0);
    },

    // Ausgewaehlte Datei Oeffnen
    btnClickOpenFile: function(inSender) {
        enyo.log("User requested remote file OPEN");
        this.doFileDownload(inSender, true);
    },

    // Ausgewahlte Datei downloaden
    btnClickDownloadFile: function(inSender) {
        enyo.log("User requested remote file DOWNLOAD");
        this.doFileDownload(inSender, false);
    },

    doFileDownload: function(inSender, openAfterDownload) {
        this.fileOpen = false;
        if (openAfterDownload !== 'undefined')
            this.fileOpen = openAfterDownload;

        this.$.spinner.show();
        this.$.buttonOpenFile.setState("disabled", true);
        this.$.buttonDownloadFile.setState("disabled", true);
        this.$.buttonCancelFile.setContent("Cancel");
        this.$.fileDownloadProgressBar.setPosition(0);
        this.$.fileDownloadProgressBar.show();

        // wenn der servername ein verzeichnis mit beinhalltet, dann muss dieser erst einmal entfernt werden.
        var path = "";
        var servername = this.currentServer.servername;
        if (servername.indexOf("/") > 0) {
            path = servername.slice(servername.indexOf("/"), servername.length);
            servername = servername.slice(0, servername.indexOf("/")); //remove trailing slash from server name if present
        }
        var usePath = this.currentServer.serverpath + encodeURI(this.currentItem.path)
        var useTarget = this.currentServer.protocol + "://" + encodeURI(this.currentServer.username).replace("@", "%40") + ":" + encodeURI(this.currentServer.password).replace("@", "%40") + "@" + servername + ":" + this.currentServer.port + usePath;
        enyo.log("Trying get file with target: " + useTarget + " to " + this.targetDir + "/" + this.currentItem.filename);

        this.$.fileDownload.call({
            target: useTarget,
            mime: this.currentItem.contenttype,
            targetDir: this.targetDir,
            targetFilename: this.currentItem.filename,
            canHandlePause: false,
            subscribe: true
        });
    },
    
    // Anzeigen der Progressbar und setzen der Position  
    downloadFileResponse: function(inSender, inResponse) {
        enyo.log("Got information about file download: " + JSON.stringify(inResponse));
        this.$.fileDownloadProgressBar.show();

        // Download Ticketnummer merken, um den download ggfs abzubrechen
        this.downloadTicket = inResponse.ticket;
        var percent = (100 / inResponse.amountTotal) * inResponse.amountReceived;

        // Nur die Position aktualisieren, wenn die Prozentzahl groesser 1 ist um ein springen des balkens zu umgehen 
        if (percent == percent && percent > 1 && percent && percent <= 100) {
            this.$.fileDownloadProgressBar.setPosition(percent);
        }

        // Download ist beendet (finished)s
        if (inResponse && (inResponse.completed || inResponse.aborted)) {
            enyo.log("Download actually complete!");
            enyo.log(JSON.stringify(inResponse));
            this.$.spinner.hide();
            if (inResponse.completionStatusCode == 200) {
                this.$.fileDownloadProgressBar.setPosition(percent);
                enyo.windows.addBannerMessage("Download complete!", "{}");
            }
            else if (inResponse.completionStatusCode == 12 || inResponse.aborted)
                enyo.windows.addBannerMessage("Download cancelled", "{}");
            else {
                enyo.windows.addBannerMessage("Download failed!", "{}");
                this.downloadFileFailure(inSender, { errorText: "Download failed - " + translateErrorCode(inResponse.completionStatusCode) + " (" + inResponse.completionStatusCode + ")"})
            }
            this.$.fileActionDialog.close();

            // Datei oeffnen sofern der User den oeffnen button drueckte
            if (this.fileOpen) {
                enyo.log("Opening downloaded file: " + this.targetDir + "/" + this.currentItem.filename);
                this.$.fileOpen.call({ target: this.targetDir + "/" + this.currentItem.filename });
                this.fileOpen = false;
            }
            this.renderDirListItem(inSender, this.selectedDirItem, true);
        }
    },

    cancelFinished : function(inSender, inResponse) {
        enyo.log("Cancel Download success, results=" + enyo.json.stringify(inResponse));
    },
    cancelFail : function(inSender, inResponse) {
        enyo.log("Cancel Download failure, results=" + enyo.json.stringify(inResponse));
    },

    // FileActionDialog fenster soll ohne weitere Aktion geschlossen werden
    btnClickCloseFileActionDialog: function(inSender) {
        this.$.spinner.hide();
        this.fileOpen = false;
        // Wenn gerade am downloaden ist, den download abbrechen
        if (this.downloadTicket) {
            this.$.fileDownloadCancel.call({ ticket: this.downloadTicket});
            this.downloadTicket = null;
            this.$.fileDownloadProgressBar.setPosition(1);
        } else {
            this.$.fileActionDialog.close();
            this.renderDirListItem(inSender, this.selectedDirItem, true);
        }
    },

    // Message Ausgabe, wenn beim herunterladen eines Files ein Fehler auftrat
    downloadFileFailure: function(inSender, inResponse) {
        this.$.spinner.hide();
        this.$.fileActionDialog.close();
        this.fileOpen = false;
        this.showInfoMessage("Error: " + inResponse.errorText);
        this.renderDirListItem(inSender, this.selectedDirItem, true);
    },

    /* *************** WebDav File List bezogene Funktionen ***************** */


    // FileList Eintraege erstellen
    renderDirListItem: function(inSender, inIndex, deselect) {
        var item = this.dirListData[inIndex];
        if (item) {

            // Pruefen ob der aktuelle Eintrag ausgewaehlt wurde
            var isSelected = (inIndex == this.selectedDirItem);
            if (deselect) { //allow override 
                isSelected = false;
                this.selectedDirItem = null;
            }
            if (isSelected) {
                // Hintergrundfarbe aendern

                // Wenn das ausgewaehlte Object ein Verzeichnis ist, dann in dieses wechseln
                if (item.contenttype == "httpd/unix-directory") {
                    enyo.warn("Changing Directory!");
                    //webdav.$.dirListScroller.scrollTo(0);
                    this.currentPath = item.path;
                    this.currentItem = null;
                    this.$.spinner.show();
                    this.davReq.getDirList(item.path, getDirListContent);
                    this.selectedDirItem = null;
                } else {
                    this.currentItem = item;
                    this.showFileActionDialog(item);
                }
            }
            this.$.dirItem.addRemoveClass("highlightedRow", isSelected);

            // Den Pfad des Verzeichnisses/Files entfernen und normalisiert ausgeben
            this.$.captionDir.setContent(item.filename);
            this.$.captionMeta.setContent("Last Modified: " + item.lastmodified);

            // Je nach type des Objectes, ein entsprechende Icon ausgeben
            this.$.dirIcon.setSrc(getImageByMimeType(item.contenttype));

            return true;
        }
    },

    //Handle icons for unknown file types
    iconError: function(inSender, inEvent) {
        unknownIcon = inEvent.target || inEvent.srcElement;
        enyo.log("Couldn't find an icon for " + unknownIcon.src + ", using default icon");
        unknownIcon.src = "images/mimetype/empty.png";
    },

    // Oeffnen des ausgewaehlten Verzeichnisses oder Datei
    btnClickOpenDirFile: function(inSender, inEvent) {
        // Ausgewaehlte Datei/Verzeichnis oeffnen  		  	  				
        this.selectedDirItem = inEvent.rowIndex;
        this.renderDirListItem(inSender, inEvent.rowIndex);
    },

    // File Liste neu Laden
    btnClickRefreshNavigator: function(inSender, inEvent) {
        if (this.connected) {
            this.$.spinner.show();
            this.davReq.getDirList(this.currentPath, getDirListContent);
        }
    },

    // Ein Verzeichnis zurueckgehen
    btnClickDirListBack: function() {
        if (this.connected) {
            this.$.spinner.show();
            this.currentPath = this.currentPath.substring(0, this.currentPath.lastIndexOf("/"));
            this.davReq.getDirList(this.currentPath, getDirListContent);
        }
    },

    // Das zu loeschende Objekt auf dem Server loeschen und die Liste entsprechend anpassen
    deleteDirListItem: function(inSender, inIndex) {
        this.davReq.deleteObject(this.dirListData[inIndex].path, getDeleteDirListItemResponse);
        this.dirListData.splice(inIndex, 1);
        this.$.dirList.render();
    },

    /* *************** Server Liste bezogene Funktionen ****************** */

    // Mit Server verbinden und Stammverzeichnis laden
    btnClickConnectServer: function(inSender, inEvent) {
        if (!this.changeServer) {
            this.$.spinner.show();
        }
        this.selectedServerItem = inEvent.rowIndex;

        this.$.serverList.render();
        this.selectNextView();
    },

    // ServerList Eintraege erstellen
    renderServerListItem: function(inSender, inIndex) {
        var item = this.serverData[inIndex];

        // Pruefen ob der aktuelle Eintrag ausgewaehlt wurde
        var isSelected = (inIndex == this.selectedServerItem);
        if (isSelected) {
            // Hintergrundfarbe aendern und Server connecten
            this.currentServer = item;
            this.currentPath = "";
            if (!this.changeServer) {
                if (this.currentServer != this.lastServer) {
                    if (this.lastServer)
                        enyo.warn("Current server changed, connecting to new server: " + item.servername + " from: " + this.lastServer.name);
                    this.connectWebDavServer(item.servername, item.serverpath, item.port, item.protocol, item.username, item.password);
                    this.selectedServerItem = null;
                    this.lastServer = this.currentServer;
                } else {
                    this.$.spinner.hide();
                }
            } else {
                this.$.addServerDialog.openAtCenter();
            }
        }
        this.$.serverItem.addRemoveClass("highlightedRow", isSelected);

        // Eintrag ausgeben
        if (item) {
            this.$.captionServer.setContent(item.name);
            return true;
        }
        this.$.spinner.hide();
    },

    // Das zu loeschende Server Object aus der Serverliste und der DB entfernen
    deleteServerListItem: function(inSender, inIndex) {
        var sqlString = "delete from serverliste where servername = '" + this.serverData[inIndex].servername + "' and name = '" + this.serverData[inIndex].name + "' and username = '" + this.serverData[inIndex].username + "';";
        //enyo.log("Writing to DB8 with sql string: " + sqlString);
        this.db.transaction(enyo.bind(this, (function(transaction) { transaction.executeSql(sqlString, [], null, enyo.bind(this, this.showErrorInInfoMessage)); })));

        this.serverData.splice(inIndex, 1);
        this.$.serverList.render();
    },


    /* ****************** AddServer Dialog bezogene Funktionen ******************* */

    // Server hinzufuegen
    btnClickShowAddServerDialog: function() {
        this.$.addServerDialog.openAtCenter();
        this.$.port.setValue("443");
    },

    addServerDialogOpen: function(inSender, inEvent) {
        if (!this.changeServer) {
            // Formular leeren
            this.$.itemName.setValue("");
            this.$.servername.setValue("");
            this.$.serverpath.setValue("");
            this.$.username.setValue("");
            this.$.password.setValue("");
            this.$.protocol.setValue("http");
            this.$.port.setValue("80");
            this.$.servername.setStyle("visibility:visible")

        } else {
            // Server Informationen in das Formular eintragen
            this.$.itemName.setValue(this.serverData[this.selectedServerItem].name);
            this.$.servername.setValue(this.serverData[this.selectedServerItem].servername);
            this.$.serverpath.setValue(this.serverData[this.selectedServerItem].serverpath);
            this.$.username.setValue(this.serverData[this.selectedServerItem].username);
            this.$.password.setValue(this.serverData[this.selectedServerItem].password);
            this.$.protocol.setValue(this.serverData[this.selectedServerItem].protocol);
            this.$.port.setValue(this.serverData[this.selectedServerItem].port);

            this.$.servername.disabled = true;
        }
    },

    // Neu angelegten Server speicher:
    btnClickSaveAddServerDialog: function() {
        // Eingaben auslesen
        nvItemName = this.$.itemName.getValue();
        nvServername = this.$.servername.getValue();
        nvServerpath = this.$.serverpath.getValue();
        nvUsername = this.$.username.getValue();
        nvPassword = this.$.password.getValue();
        nvProtocol = this.$.protocol.getValue();
        nvPort = this.$.port.getValue();

        // Neuen Server Speichern oder aktualisieren
        this.nullHandleCount = 0;
        if (!this.changeServer) {
            var sqlString = 'insert into serverliste (servername,serverpath,name,username,password,protocol,port) values ("' + nvServername + '","' + nvServerpath + '","' + nvItemName + '","' + nvUsername + '","' + nvPassword + '","' + nvProtocol + '","' + nvPort + '");';
            var itemPos = this.serverData.length;
        } else {
            var sqlString = 'update serverliste set servername="' + nvServername + '", serverpath="' + nvServerpath + '", name="' + nvItemName + '", username="' + nvUsername + '",password="' + nvPassword + '",protocol="' + nvProtocol + '",port="' + nvPort + '" where servername = "' + nvServername + '"';
            var itemPos = this.selectedServerItem;
        }
        //enyo.log("writing to DB8 with sql string: " + sqlString);
        this.db.transaction(enyo.bind(this, (function(transaction) { transaction.executeSql(sqlString, [], null, enyo.bind(this, this.showErrorInInfoMessage)); })));

        // Eingaben in ein Array schreiben
        this.serverData[itemPos] = { servername: nvServername, serverpath: nvServerpath, name: nvItemName, username: nvUsername, password: nvPassword, protocol: nvProtocol, port: nvPort };

        this.$.serverList.renderRow(itemPos);
        this.$.serverList.render();

        this.$.addServerDialog.close();
    },

    // AddServerDialog schliessen ohne zu speichern
    btnClickCloseAddServerDialog: function() {
        this.$.itemName.setValue("");
        this.$.servername.setValue("");
        this.$.serverpath.setValue("");
        this.$.username.setValue("");
        this.$.password.setValue("");
        this.$.protocol.setValue("https");
        this.$.port.setValue("443");
        this.$.addServerDialog.close();
    },

    // Ein anderes Protokoll wurde ausgewaehlt.
    protocolChanged: function(inSender, inValue, inOldValue) {
        if (inValue == "https") {
            this.$.port.setValue("443");
        } else {
            this.$.port.setValue("80");
        }

    },

    /* ***************** Info Message Dialog Funktionen ******************* */

    // Info Message schliessen
    btnClickCloseInfoMessageDialog: function(inSender, inEvent) {
        this.$.infoMessage.setContent("");
        this.$.infoMessageDialog.close();
    },

    // Info Message Fenster mit uebergebenen error Object oeffnen  
    showErrorInInfoMessage: function(inTrans, inError) {
        this.showInfoMessage("Error Message: " + inError.message + " |  Error Code: " + inError.code);
    },

    // Info Message Fenster mit uebergebenen error Object oeffnen  
    showAboutMessage: function(inTrans, inError) {
        this.showInfoMessage("WebDAV Client: Original code by Aventer, updates by Jon Wise, 2021.");
    },

    // Info Message Fenster mit uebergebenen Text oeffnen
    showInfoMessage: function(text) {
        this.$.infoMessageDialog.openAtCenter();
        this.$.infoMessage.setContent(text);
    },

    /* ***************** WebDAV bezogene Funktionen ********************* */

    // Mit dem WebDav Server verbinden
    connectWebDavServer: function(servername, serverpath, port, protocol, username, password) {
        // wenn der servername ein verzeichnis mit beinhalltet, dann muss dieser erst einmal entfernt werden.
        var path = "";
        if (servername.indexOf("/") > 0) {
            path = servername.slice(servername.indexOf("/"), servername.length);
            servername = servername.slice(0, servername.indexOf("/"));
        }

        this.davReq.init(servername, serverpath, port, protocol, username, password);
        this.davReq.getDirList(path, getDirListContent);
    },

});


// request Handler fuer das Auslesen des WebDav Verzeichnisses. Diese Funktion wird aus der davAPI aufgerufen
// content = JSON Object mit folgendem Aufbau {path:, filename, creationdate:, lastmodified:, contenttype:}
function getDirListContent(content, requestState) {
    if (content && requestState == 4) {
        webdav.connected = true;
        //webdav.$.dirListScroller.scrollTo(0);
        webdav.$.spinner.hide();
        webdav.dirListData = content
        webdav.$.dirList.render();
    } else {
        if ((requestState <= 0 && content != null) || requestState > 4) {
            enyo.windows.addBannerMessage("HTTP Error retreiving directory list!", "{}");
            webdav.$.spinner.hide();
        }
    }
}

// request Handler fuer das auswerten des Rueckgabecodes des loeschvorganges
function getDeleteDirListItemResponse(content) {
    // Bei dem getesteten webdav server, gab es hier nie response
}

// request Handler fuer das anlegen eines neuen Verzeichnisses
function getCreateFolderRequest(content) {
    // Bei dem getesteten webdav server, gab es hier nie response
    webdav.davReq.getDirList(webdav.currentPath, getDirListContent);
}

// request Handler fuer das uploaden einer Datei
function uploadFileSuccess(content) {
    webdav.davReq.getDirList(webdav.currentPath, getDirListContent);
}

// Die eigentliche encodeURI Version scheint unter webos nicht wirklich zu funktionieren, daher diese hier
function myescape(content) {
    content = encodeURI(content);
    return content.replace(/@/g, "%40");
}

function translateErrorCode(code) {
    switch(code) {
        case -1:
            return "General error";
        case -2:
            return "Connection timeout";
        case -3:
            return "Corrupt file";
        case -4:
            return "File system error";
        case -5:
            return "HTTP error";
        case 11:
            return "Download interrupted";
        case 12:
            return "Download canclled";
        default:
            return "Unknown error";
    }
}

// Datei Icon je nach contenttype ausgeben
function getImageByMimeType(contenttype) {

    switch(contenttype) {
        case "application/msword":
            return "images/mimetype/application-msword.png";
        default:
            iconPath = contenttype.replace("/", "-");
            iconPath = iconPath.split(";");
            iconPath = iconPath[0];
            iconPath = "images/mimetype/" + iconPath + ".png";
            return iconPath;        
    }
}