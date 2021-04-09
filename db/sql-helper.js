//takes in an array and property to form a string of conditionals
const createConditionals = (property, arr) => {
  let result = '';

  for (let i = 0; i < arr.length; i++) {
    if (i == arr.length - 1) {
      result += `${property}=?`;
    } else {
      result += `${property}=? OR `;
    }
  }

  return result;
};

//merges each element together with an AND inbetween
const linkTogether = arr => {
  let result = ' WHERE ';

  for (let i = 0; i < arr.length; i++) {
    if (i == arr.length - 1) {
      result += arr[i];
    } else {
      result += arr[i] + ' AND ';
    }
  }

  return result;
};

module.exports = {
  createConditionals: createConditionals,
  linkTogether: linkTogether
};
