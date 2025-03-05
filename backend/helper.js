function remove(arr, idx) {
    let newArr = [];
    for (let i=0; i < arr.length; i++) {
        if (i != idx) {
            newArr.push(arr[i]);
        }
    }
    return newArr;
}

module.exports = {remove};