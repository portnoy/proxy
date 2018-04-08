#!/bin/bash

usage () 
{
	echo
    echo "Usage: $0 [iterations] [target]"
	echo
	exit 1
}

# this is a very quick load test
ITER=$1 
[ -z "$ITER" ] && ITER=10
shift

TARGET=$1
[ -z "$TARGET" ] && TARGET='local'
shift

if [ "$TARGET" == 'local' ] ; then
    PROTO='http'
    HOST='localhost'
    PORT=':8081'
elif [ "$TARGET" == 'google' ] ; then
    PROTO='https'
    HOST='proxy-3030.appspot.com'
    PORT=''
else
    echo "Don't know how to test on $TARGET"
    usage
fi

PROXY=${PROTO}://${HOST}${PORT}

# sanity test
rc=`curl -s -o /dev/null -w "%{http_code}" ${PROXY}/`
[ $rc -ne 200 ] && echo "Trivial test failed" && exit 2

rc=`curl -s -o /dev/null -w "%{http_code}" ${PROXY}/404`
[ $rc -ne 404 ] && echo "Trivial negative test failed" && exit 3

echo "Trivial tests passed"
echo "Starting parallel downloads"
echo

mkdir -p data

# large file
# curl -o /dev/null ${PROXY}/image?url=http://www.effigis.com/wp-content/themes/effigis_2014/img/Airbus-Spot6-50cm-St-Benoit-du-Lac-Quebec-2014-09-04.tif &

# bunch of smaller files in parallel
for cnt in `seq $ITER` ; do
 curl ${PROXY}/image?url=https%3A%2F%2Fproxy.co%3A443%2Ffavicon.png -o data/favicon.png  &
 curl ${PROXY}/image?url=https%3A%2F%2Fcdn.asme.org/getmedia/8b60ca43-62e5-4c93-a065-f095edc0199b/John_Harrison-Mechanisms_Systems_Devices-hero.jpg -o data/medium.jpg  &
 curl ${PROXY}/image?url=https%3A%2F%2Fdummyimage.com/888/09f.png/fff -o data/dummy.png &
done

