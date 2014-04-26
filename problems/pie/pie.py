n = input()
q = 0
h = 0
t = 0

for i in range(n):
    s = raw_input().strip()
    if s == 'half':
        h += 1
    elif s == 'quarter':
        q += 1
    else:
        t += 1

total = min(q, t)
q -= total
t -= total
total += h/2
h = h % 2
if h:
    temp = min(2, q)
    total += 1
    h -= 1
    q -= temp

total += q/4
total += 1 if q % 4 else 0

total += t

total += 1
print total
