const database = require('./datbase');

module.exports = function printInventory(inputs) {
    let items = formatInputs(inputs);
    items = formatItems(items);

    items = countItemsSubtotal(items);

    items = markPromotionItem(items);

    items = countSavedMoney(items);

    const total = getTotal(items);
    const saved = getSaved(items);

    const printText = getPrintTest(items, total, saved);
    console.log(printText);
};

const formatInputs = (inputs) => {
    const results = [];
    inputs.forEach(input => {
        const array = input.split('-');
        let count = 1;
        const barcode = array[0];
        if (array.length > 1) {
            count = array[1];
        }

        const item = results.find(result => result.barcode === barcode);

        if (item) {
            item.count += count;
        } else {
            results.push({barcode, count});
        }
    })

    return results;
}

const formatItems = (items) => {
    const allItems = database.loadAllItems();
    return items.map(item => {
        const findItem = allItems.find(a => a.barcode === item.barcode);
        if (findItem) {
            return Object.assign({}, findItem, {count: item.count});
        }

        return item;
    })
}

const markPromotionItem = (items) => {
    const promotions = database.loadPromotions()
    const promotionBarcodes = promotions[0].barcodes
    return items.map(item => {
        let isPromotion = 0;
        if (promotionBarcodes.includes(item.barcode)) {
            isPromotion = 1;
        }

        return Object.assign({}, item, {isPromotion});
    })
}

const countItemsSubtotal = (items) => {
    return items.map(item => Object.assign({}, item, {subtotal: item.price * item.count}));
}

const countSavedMoney = (items) => {
    return items.map(item => {
        const {price, isPromotion} = item;
        let count = 0;
        if (isPromotion === 1) {
            count = Math.floor(item.count / 3);
        }

        return Object.assign({}, item, {saved: price * count});
    })
}

const getTotal = (items) => {
    return items.reduce((p, n) => p + n.subtotal, 0);
}

const getSaved = (items) => {
    return items.reduce((p, n) => p + n.saved, 0);
}

const getPrintTest = (items, total, saved) => {
    let result = '***<没钱赚商店>购物清单***\n';
    result += `${getAllItemsString(items)}
----------------------
挥泪赠送商品：
${getPromotionItems(items)}
----------------------
总计：${(total - saved).toFixed(2)}(元)
节省：${saved.toFixed(2)}(元)
**********************`;
    return result;
}

const getAllItemsString = (items) => {
    return items.map(item => `名称：${item.name}，数量：${item.count + item.unit}，单价：${item.price.toFixed(2)}(元)，小计：${(item.subtotal - item.saved).toFixed(2)}(元)`).join('\n');
}

const getPromotionItems = (items) => {
    return items.filter(item => item.isPromotion).map(item => {
        return `名称：${item.name}，数量：${Math.floor(item.count / 3) + item.unit}`
    }).join('\n');
}