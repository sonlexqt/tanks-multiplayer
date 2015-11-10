/**
 * Created by Hieu on 11/10/2015.
 */
function angleToPointer(displayObject, pointer) {
    if (pointer){
        var dx = pointer.worldX - displayObject.x;
        var dy = pointer.worldY - displayObject.y;

        return Math.atan2(dy, dx);
    } else return 0;
}

function distanceBetween(source, target) {

    var dx = source.x - target.x;
    var dy = source.y - target.y;

    return Math.sqrt(dx * dx + dy * dy);

}

function moveToObject(displayObject, destination, speed, maxTime) {

    if (typeof speed === 'undefined') { speed = 60; }
    if (typeof maxTime === 'undefined') { maxTime = 0; }

    var angle = Math.atan2(destination.y - displayObject.y, destination.x - displayObject.x);

    if (maxTime > 0)
    {
        //  We know how many pixels we need to move, but how fast?
        speed = distanceBetween(displayObject, destination) / (maxTime / 1000);
    }

    displayObject.body.velocity.x = Math.cos(angle) * speed;
    displayObject.body.velocity.y = Math.sin(angle) * speed;

    return angle;
}

function distanceToPointer(displayObject, pointer) {
    var dx = displayObject.x - pointer.worldX;
    var dy = displayObject.y - pointer.worldY;
    return Math.sqrt(dx * dx + dy * dy);
}

function moveToPointer(displayObject, speed, pointer, maxTime) {

    if (typeof speed === 'undefined') { speed = 60; }
    if (typeof maxTime === 'undefined') { maxTime = 0; }

    var angle = angleToPointer(displayObject, pointer);

    if (maxTime > 0)
    {
        //  We know how many pixels we need to move, but how fast?
        speed = distanceToPointer(displayObject, pointer) / (maxTime / 1000);
    }

    displayObject.body.velocity.x = Math.cos(angle) * speed;
    displayObject.body.velocity.y = Math.sin(angle) * speed;

    return angle;
}

function angleBetween(source, target) {
    var dx = target.x - source.x;
    var dy = target.y - source.y;

    return Math.atan2(dy, dx);
}

function angleToPointer(displayObject, pointer) {
    var dx = pointer.worldX - displayObject.x;
    var dy = pointer.worldY - displayObject.y;

    return Math.atan2(dy, dx);
}
