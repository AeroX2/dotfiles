#!/bin/bash

mkdir school-server
sudo mount -t cifs //10.19.188.65/students/home/2015/james.ridey school-server -o "user=james.ridey"

