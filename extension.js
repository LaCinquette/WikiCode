const { link } = require('fs');
const { env } = require('process');
const vscode = require('vscode');
const wiki = require('./src/wiki');

let LOGIN_TOKEN;

function activate(context) {	
	context.subscriptions.push(vscode.commands.registerCommand('wikicode.Search', function () {
		var searchPick = vscode.window.createQuickPick();
		searchPick.show();
		searchPick.onDidChangeValue(async () => {
			searchPick.items = []
			if(searchPick.value != ""){
				var params = {
					action: "query",
					list: "search",
					srsearch: `${searchPick.value}`,
					format: "json"
				}
				let contentQuickPick = await wiki.requestSearch(params)
				if(contentQuickPick === null){
					searchPick.items = []
					searchPick.show();
					return
				}
				contentQuickPick = contentQuickPick.map(element => {return {
					label: element['title'],
					detail: element['snippet'],
					description: '',
					pageid: element['pageid'],
					link: 'https://en.wikipedia.org/?curid=' + element['pageid']
				}})
				if(searchPick.value == params.srsearch){
					searchPick.items = contentQuickPick
				}
			}
			searchPick.show();
		});
		searchPick.onDidAccept(async () => {
			searchPick.dispose()
			let answer = await vscode.window.showInformationMessage(`Do you want to open ${searchPick.selectedItems[0]['link']}?`, 'Yes', 'No')
			if(answer == 'Yes'){
				vscode.env.openExternal(searchPick.selectedItems[0]['link'])
			}
		})
	}));

	context.subscriptions.push(vscode.commands.registerCommand('wikicode.GetToken', async function () {
		LOGIN_TOKEN = await wiki.requestGetLoginToken({
			action:"query",
    		meta:"tokens",
    		type:"login",
    		format:"json"
		})
		vscode.window.showInformationMessage(`Your token is: ${LOGIN_TOKEN}`)
		console.log(LOGIN_TOKEN)
	}));

	context.subscriptions.push(vscode.commands.registerCommand('wikicode.DownloadWikiPage', async function () {
		let page = await vscode.window.showInputBox({
			placeHolder: "Enter page's link",
			title: "Download Wiki",
			ignoreFocusOut: true
		})
		if(vscode.workspace.workspaceFolders == null){
			vscode.window.showErrorMessage("You haven't open folder yet. Open it first.")
		}
		console.log(vscode.workspace.workspaceFolders[0].uri)
		wiki.downloadWikiPage(page, vscode.workspace.workspaceFolders[0].uri.path)
	}));
}
function deactivate() {}

module.exports = {
	activate,
	deactivate
}