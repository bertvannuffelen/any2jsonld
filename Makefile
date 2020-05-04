SHELL=/bin/bash
OUTPUT=output
INPUT=input
TEMPLATE=template

JSONLDFILES=${OUTPUT}/example.jsonld 

TTLFILES=$(JSONLDFILES:.jsonld=.ttl)

build:
	docker images mob --format "{{.ID}}" > rm.old
	docker build -t mob .
	docker rmi `cat rm.old`

run:
	docker run --rm -it --name mobt -v ${CURDIR}:/data mob /bin/bash

test: getfeeds output json-renderer.js ${TTLFILES}

%.ttl: %.jsonld
	jsonld format -q $< > $@

${OUTPUT}/example.jsonld: ${INPUT}/example.json json-renderer.js ${TEMPLATE}/example.template
	node /app/json-renderer.js -t ${TEMPLATE}/example.template -i $< --list 'data.stations[*]' -o $@



getfeeds: ${INPUT}/example.json 

${INPUT}/example.json: 
	cd ${INPUT} ; ./get_data1.sh
























${INPUT}/bird-antwerp.gbfs.json: ${INPUT}/get_data2.sh
	sudo chmod a+x ${INPUT}/*.sh
	cd ${INPUT} ; sudo ./get_data2.sh

output:
	sudo mkdir -p ${OUTPUT}
	sudo chmod 777 ${OUTPUT}

realclean:
	rm -rf ${TTLFILES} ${JSONLDFILES}
