import random

n = 300
print n

base = 17 * 19 * 23

for i in range(n):
    print base * random.randint(1,1000)

