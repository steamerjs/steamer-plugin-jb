module.exports = {
    name: 'project',
    offline: {
        'publish': true,
        'compatible': 0,
        'bid': '', 
        'qversionfrom': '0', 
        'qversionto': '0',
        'platform': [2, 3], 
        'loadmode': 2,
        'frequency': 1,
        'verifyType': 0,
        'expire_time': 1577836800000, 
        'cdn': 'defaultCDN',
        'note': '',
        'gray': true,
        'uins': [
           
        ], 
        'verifyFilterRegex': 'html|js|png'
    },
    distConfig: {
        buildCommand: {
           command: 'npm',
           args: ['run', 'dist']
        }
    },
};