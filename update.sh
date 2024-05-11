rm -f purlfy.js
wget https://cdn.jsdelivr.net/gh/PRO-2684/pURLfy@latest/purlfy.min.js -O purlfy.js

mkdir -p rules
wget https://cdn.jsdelivr.net/gh/PRO-2684/pURLfy-rules@core-0.3.x/cn.min.json -O rules/cn.json
wget https://cdn.jsdelivr.net/gh/PRO-2684/pURLfy-rules@core-0.3.x/alternative.min.json -O rules/alternative.json
