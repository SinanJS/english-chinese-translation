'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as request from 'request';

const config = {
    api: 'http://xtk.azurewebsites.net/BingDictService.aspx',
};
let channel: any = null;

interface TranslationResult {
    word: string;
    pronunciation: any;
    defs: Array<any>;
    sams: Array<any>;
}

class Translator {
    private _api: string;

    constructor(api: string) {
        this._api = api;
    }
    public resultCn(word: string): Promise<TranslationResult> {
        if (!word) {
            throw new Error('没有选中文本');
        }
        const requestPormise = new Promise<TranslationResult>((resolve, reject) => {
            request.get({
                url: `${this._api}?Word=${encodeURI(word)}`
            }, (err: any, res: any, body: any) => {
                if (err) {
                    reject(err);
                }
                let data = JSON.parse(body);
                console.log("msg", data);
                resolve(data);
            });
        });
        return requestPormise;
    }
}
// function 
// // this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "english-chinese-translation" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('extension.translate', () => {
        // The code you place here will be executed every time your command is executed
        let editor = vscode.window.activeTextEditor;

        if (!editor) {
            return console.log('no open text editor!');
        }


        // result.channel.clear();
        // result.channel.hide()

        let selection = editor.selection;
        let text = editor.document.getText(selection);
        let translator = new Translator(config.api);
        console.log('text', text);
        try {
            translator.resultCn(text)
                .then((data: TranslationResult) => {
                    let { word, pronunciation, defs } = data;
                    let defsStr = '';
                    defs = defs.map(item => {
                        const { pos, def } = item;
                        const str = `${pos} ${def}`;
                        defsStr = defsStr + `\n${str}`;
                        return str;
                    });
                    let msg = `${word}${pronunciation ? `\n🇬🇧[${pronunciation.BrE}]，🇺🇸[${pronunciation.AmE}]` : ''}${defsStr}\n---------------------------\n`;
                    if (!channel) {
                        channel = vscode.window.createOutputChannel('translator');
                    }
                    channel.appendLine(msg);
                    channel.show();
                    // vscode.window.showInformationMessage(, { modal: false });
                }).catch((err) => {
                    vscode.window.showInformationMessage('没有查询到结果');
                });
        } catch (e) {
            vscode.window.showInformationMessage(e.message);
        }
        // Display a message box to the user
    });

    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}