const fs = require("fs");
const jsonfile = require('jsonfile');
const jsonld = require('jsonld');
const camelCase = require('camelcase');
const papaparse = require('papaparse');
const sha3_512 = require('js-sha3').sha3_512;


var program = require('commander');

program
    .version('0.8.0')
    .usage('node csv-renderer.js renders the content of a CSV file into a jsonld template')
    .option('-t, --template <template>', 'jsonld template to render')
    .option('-h, --contextbase <hostname>', 'the public base url on which the context of the jsons are published.')
    .option('-r, --documentpath <path>', 'the document path on which the jsons are is published')
    .option('-x, --debug <path>', 'dump the intermediate json which will be used by the templaterenderer')
    .option('-i, --input <path>', 'input file (a csv file)')
    .option('-o, --output <path>', 'output file (a json file)')

program.on('--help', function () {
    console.log('')
    console.log('Examples:');
    console.log('  $ csv-renderer --help');
    console.log('  $ csv-renderer -i <input> -o <output>');
});

program.parse(process.argv);

var output = program.output || 'output.json';

stream_csv(program.template, program.input, output);
// render_csv(program.template, program.input, output);
console.log('done');


function stream_csv(templateFilename, input, output) {
    console.log('read template');
    var rawdata = fs.readFileSync(templateFilename, 'utf-8');
    let template = JSON.parse(rawdata);
    console.log('start processing data');
    let writeStream = fs.createWriteStream(output);
    let first = true;
    var csvf = fs.readFileSync(input, 'utf-8');
    papaparse.parse(csvf, {
        header: true,
        skipEmptyLines: true,
        step: function (row) {
            // console.log("Row:", row.data);
            let entry = makeDataEntry(template, row.data);
            // console.log(entry);
            writeStream.write(first ? "[\n" : "\n,");
            first = false;
            writeStream.write(JSON.stringify(entry));
            // console.log("--------");

        },
        complete: function () {
            writeStream.write("\n]");
            console.log("All done!");
        }
    });

}


function makeDataEntry(template, data) {
    let tranformedData = {};

    for (const key in template) {
        let value = template[key];
        if (typeof value === "string") {
            if (value !== "") tranformedData[key] = value;
        } else if (value instanceof Array) {
            tranformedData[key] = [];
            for (const index in value) {
                let buildData = getDataEntry(value[index], data);
                if (buildData != null) {
                    tranformedData[key].push(buildData);
                }
            }
        } else {
            let buildData = getDataEntry(value, data);
            if (buildData != null) {
                tranformedData[key] = buildData;
            }
        }
    }
    return tranformedData;

// "{\"@value\":{\n" +
// "    \"type\":\"languageText\",\n" +
// "    \"key\":\"AanbiederOrganisaite\"\n" +
// "  },\"@language\":\"nl\"}"
}

function getDataEntry(value, data) {
    if (value.hasOwnProperty('template_type') && value.hasOwnProperty("template_key")) {
        return getData(value, data);
    } else {
        let buildData = makeDataEntry(value, data);
        return Object.keys(buildData).length ? buildData : null;
    }

}

function getData(template, data) {
    let key = template["template_key"];
    if (!(key in data)) {
        if(key !== 'MISSING') {
            console.warn("unknown key: " + key);
        }
        return null;
    }
    let information = data[key];
    information = information ? information.trim() : information

    const type = template["template_type"];
    if (information) {
        switch (type) {
            case "boolean":
                return information == 'true'
            case "base_uri":
                return template["template_base_uri"] + information
            case "base_uri_beperking":
                return template["template_base_uri"] + information === "fysischNietRealiseerbaar" ? information : information.toLowerCase()

            case "base_uri_lower":
                return template["template_base_uri"] + information.toLowerCase()
            case "base_uri_camel_lower":
                return template["template_base_uri"] + camelCase(information).toLowerCase()

            case "base_uri_gebruik":
                switch (information) {
                    case "inGebruik":
                        return template["template_base_uri"] + "wel"
                    case "nietInGebruik":
                        return template["template_base_uri"] + "niet"
                    default:
                        console.warn("uri_gebruik does not know this information:" + information);
                        return template["template_base_uri"] + information;
                }
            case "date":
                return information !== '9999/12/31 00:00:00' ? new Date(Date.parse(information)).toISOString() : null;
            case "number":
                let number = Number(information);
                return isNaN(number) ? null : number
            case "text":
                if (template["template_filter_null"] && information === "<Null>") {
                    return null;
                }
                if (template["template_filter_regex"]) {
                    let match = information.match(template["template_filter_regex"]);
                    return match ? match[0].replaceAll("\s", " ").replaceAll("\u2008", "") : null;
                } else {
                    return information;
                }
            case "id":
            case "uri":
                return information
            case "wellknown":
                return "https://bedrijventerrein.vlaanderen.be/id/.well-known/genid/"+template["template_known_type"]+"/" + sha3_512(information)
            case "languageText":
                return {
                    '@value': information,
                    '@language': 'nl'
                }
            default:
                console.warn("type not configured:" + type);
                return null
        }
    } else {
        if (type === "number") {
            return information === '0' ? 0 : null;
        } else {
            return null;
        }
    }
}



