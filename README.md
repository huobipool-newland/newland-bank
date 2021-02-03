## 编译

```
npm install
truffle build
```

## 部署

1. 在networks目录下修改不同环境的合约信息
2. 修改migrates目录下文件中引用不同的networks文件
3. truffle migrate
4. 将migrate最后输出的JSON字符串给前端,前端更新信息

## 调试

truffle console
