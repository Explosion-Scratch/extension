chrome.omnibox.setDefaultSuggestion({
    "description": "Enter 'morse' or 'regex'"
});

chrome.omnibox.onInputStarted.addListener(function() {
    console.log("Input Started");
});
chrome.omnibox.onInputCancelled.addListener(function() {
    console.log("Input Cancelled");
});
chrome.omnibox.onInputEntered.addListener(function(text) {
    console.log("Input Entered is " + text);
    previousInputs.push(text);
});
chrome.omnibox.onInputChanged.addListener(function(txt, suggest) {
    let text = txt || " ";
    text = text.replace(/^c /, "cipher ");
    text = text.replace(/^mo /, "morse ");
    text = text.replace(/^m /, "math ");
    text = text.replace(/^re /, "regex ");
    text = text.replace(/^r /, "replace ");
    let valid_suggest = true;
    var suggestions = [];
    suggestions = [{content: " ", description: "Commands are 'morse', 'regex', 'math', and 'cipher'."}];
    if (/^math /.test(text)) {
        text = text.replace(/^math /, "");
        suggestions = [
            {
                content: e(text) || "0",
                description: e(text) || "0",
            }
        ];
    }
    if (/^replace /.test(text)) {
        text = text.replace(/^replace /, "");
        suggestions = find_replace(text)
        function find_replace(text){
            if (!(/".+" ".+"/.test(text))) return [{content: "Invalid format, the correct format is \"Find\" \"Replace\"", description: "Invalid format, the correct format is \"Find\" \"Replace\""}];
            let find = text.match(/"(.+)" "(.+)"/);
            let replace = find[2];
            find = find[1];
            let output = text.replace(new RegExp(find, "g"), replace);
            return [{content: output || "No text inputted.", description: "Replaced: " + output}] 
        }
    }
    if (/^morse /.test(text)) {
        text = text.replace(/^morse /, "");
        suggestions = [
            {
                content: encodeMorse(text, "smart") || "No text",
                description: "Encoded/decoded: " + encodeMorse(text, "smart"),
            }
        ];
    }
    if (/^cipher /.test(text)){
        text = text.replace(/^cipher /, "");
        previousInputs = [];
        suggestions = cipher_suggestions(text) || [
            {
                content: "Encrypt with a Ceasar cipher. Enter the key then the string to encrypt",
                description: "Encrypt with a Ceasar cipher. Enter the key then the string to encrypt"
            }
        ]
        function cipher_suggestions(t) {
            if (t.trim() === ""){
                return null;
            }
            if (!(/^[\-0-9]+ .+$/.test(t))) {
                return [{content: "Invalid form", description: "Please make sure the input is in the following form: key text"}];
            }
            let key = t.match(/^([\-0-9]+) /)[1];
            key = +key;
            t = t.replace(/[\-0-9]+ /, "");
            let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            chars = chars.split("");
            let output = t.split("").map((e) => {
                if (chars.indexOf(e.toUpperCase()) === -1) return e;
                return chars[(chars.indexOf(e.toUpperCase()) + key) % chars.length];
            }).join("");
            let decrypt = t.split("").map((e) => {
                if (chars.indexOf(e.toUpperCase()) === -1) return e;
                return chars[(chars.indexOf(e.toUpperCase()) + key * -1) % chars.length];
            }).join("");
            return [{content: decrypt || "No text", description: `Decrypted: ${decrypt}`}, {content: output || "No text", description: `Encrypted: ${output}`}];
        }
    }
    if (/^regex /.test(text)) {
        text = text.replace(/^regex /, "");
        suggestions = re_suggestions(text);
        function re_suggestions(r) {
            if (/^\/[^\/]{1,100000}\/[a-zA-Z]{0,10} .+$/.test(r)){
                let output = [];
                r = r.match(/^\/([^\/]{1,100000})\/([a-zA-Z]{0,10}) (.+)$/);
                let regex;
                try {
                  regex = new RegExp(r[1], r[2]);
                  output.push({content: "true", description: `Valid: True`});
                } catch(e) {
                  output.push({content: "false", description: `Valid: False`});
                  output.push({content: "Invalid flags, testing with no flags.", description: "Error: Invalid flags, testing with no flags."})
                  regex = new RegExp(r[1], "");
                }
                if (regex.test(r[3])){
                    output.push({content: `true`, description: `Matches text: true`});
                } else {
                    output.push({content: `false`, description: `Matches text: false`});
                }
                let matches = r[3].match(regex);
                output.push({content: `${JSON.stringify(matches)}`, description: `Matches: ${JSON.stringify(matches)}`});
                return output;
            } else {
                return [{content: "Invalid regex, valid form is /regex/flags text to test", description: "Invalid regex, valid form is /regex/flags text to test"}];
            }
        }
    }
    suggest(suggestions);
});
/*
        {
            content: "" + morse(text),
            description: "Encode \"" + text + "\""
        },
        {
            content: "" + decode(text),
            description: "Decode \"" + text + "\""
        }
        
*/
function decodeMorse(text, mode) {
    if (!(/^[\. -/]+$/.test(text))){
        if (mode === "smart") return encodeMorse(text);
        return "Already decoded"
    }
    return text.split(" ").map((e) => {
        let keys = Object.keys(alphabet);
        for(let i = 0; i < keys.length; i++){
            if (alphabet[keys[i]] === e.toLowerCase()){
                return keys[i] || "_";
            }
        }
    }).join("").toUpperCase();
}
function encodeMorse(text, mode) {
    if (/^[\. -/]+$/.test(text)){
        if (mode === "smart") return decodeMorse(text);
        return "Already encoded"
    }
    return text.split('').map(function(e) {
        return alphabet[e.toLowerCase()] || '';
    }).join(' ').replace(/ +/g, ' ') || "No string inputted";
}
var alphabet = {
        'a': '.-',
        'b': '-...',
        'c': '-.-.',
        'd': '-..',
        'e': '.',
        'f': '..-.',
        'g': '--.',
        'h': '....',
        'i': '..',
        'j': '.---',
        'k': '-.-',
        'l': '.-..',
        'm': '--',
        'n': '-.',
        'o': '---',
        'p': '.--.',
        'q': '--.-',
        'r': '.-.',
        's': '...',
        't': '-',
        'u': '..-',
        'v': '...-',
        'w': '.--',
        'x': '-..-',
        'y': '-.--',
        'z': '--..',
        ' ': '/',
        '1': '.----',
        '2': '..---',
        '3': '...--',
        '4': '....-',
        '5': '.....',
        '6': '-....',
        '7': '--...',
        '8': '---..',
        '9': '----.',
        '0': '-----',
        '.':'.-.-.-',
        ',':'--..--',
        '?': '..--..',
        '!':'-.-.--',
        '\'':'.----.',
        '(':'-.--.',
        ')':'-.--.-',
        '&':'.-...',
        ':':'---...',
        ';':'-.-.-.',
        '/':'-..-.',
        '_':'..--.-',
        '=':'-...-',
        '+':'.-.-.',
        '-':'-....-',
        '$':'...-..-',
        '@':'.--.-.',
    }
function e(t){
   t = t.split("").filter((z) => /[+\-*\/0-9\(\)]/.test(z)).join("");
   t = t.replace(/sqrt\([0-9]+\)/, f => {
     let ints = f.match(/sqrt\(([0-9]+)\)/);
     return Math.sqrt(+ints[1]);
   })
   t = t.replace(/\([^\)]+\)/, (f) => {
      f = f.split("").filter((z) => /[+\-*\/0-9]/.test(z)).join("");
      return e(f);
   })
   t = t.replace(/([0-9]+)\*\*([0-9]+)/, f => {
     let ints = f.match(/([0-9]+)[^0-9]\*\*([0-9]+)/);
     return (+ints[1]) ** (+ints[2]);
   })
   t = t.replace(/([0-9]+)\/([0-9]+)/, f => {
     let ints = f.match(/([0-9]+)[^0-9]([0-9]+)/);
     return +ints[1] / +ints[2];
   })
   t = t.replace(/([0-9]+)\*([0-9]+)/, f => {
     let ints = f.match(/([0-9]+)[^0-9]([0-9]+)/);
     return +ints[1] * +ints[2];
   })
   t = t.replace(/([0-9]+)\+([0-9]+)/, f => {
     let ints = f.match(/([0-9]+)[^0-9]([0-9]+)/);
     return +ints[1] + +ints[2];
   })
   t = t.replace(/([0-9]+)\-([0-9]+)/, f => {
     let ints = f.match(/([0-9]+)[^0-9]([0-9]+)/);
     return +ints[1] - +ints[2];
   })
  return t;
}