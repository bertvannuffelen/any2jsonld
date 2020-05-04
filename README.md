# objectives

any2jsonld is a simple transformation tool that given a tabular data (csv) or json data the provided datafeed transforms to jsonld according to a template.

It can be used to do quick POC's on existing data. 


## build & run
###
The automation has been done for a linux environment having _make_ en _docker_ installed.

### build
The command 
```
make build
```
will trigger the docker build process. It will automatically remove the previous existing image. 

Warning: check if the docker image name is not one used by yourself. Otherwise this might have undesired side-effects.

### run
The command 
```
make run
```
will initiate a docker container having the current directory mounted on /data.
Assumption for now is that it should be the git repository.

### test
The Makefile does setup a testing process, however it requires the user to complete it with its own configuration to let 
it work as desired.


To execute the tests, initiate in the the container's commandline the following
```
cd /
sudo chmod -R 777 /data
cd /data
make test
```

This will download the example feeds, and process them. The result is found in the output directory.



## example data

## templates



