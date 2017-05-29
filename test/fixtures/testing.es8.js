var KEY1 = { X: 42 },
    KEY2 = { Y: 13 };

async function just_ensure_this_can_be_parsed() {
    await do_stuff();

    return 42;
}

var OBJECT_WITH_DYNAMIC_KEYS = {
    [KEY1.X]: 'a',
    // TODO PM-42: fix this
    [KEY2.Y]: 'b'
};
