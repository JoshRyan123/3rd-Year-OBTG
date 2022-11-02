from mpl_toolkits import mplot3d
import numpy as np
import math
import matplotlib.pyplot as plt
import pandas as pd

x=[]                                      #stores x coordinates contained in 3rd column of csv
y=[]                                      #stores y coordinates contained in 4th column of csv
xdata=[]
ydata=[]
username = "atest"                        #userid
start = "2022-04-17 16:25:44"             #timestamp
end = "2022-04-17 16:28:20"               #timestamp
path_to_csv = 'data/atest_tictactoe.csv'
df = pd.read_csv(path_to_csv)

count = 0
for i in range(0, len(df)):
    if df.iloc[i,12] == username:
        if df.iloc[i,0] > start and df.iloc[i,0] < end:
            if i != 0:
                count += 1
                # 
                x.append(int(df.iloc[i,2]))
                y.append(int(df.iloc[i,3]))

                ydata.append((df.iloc[i,0]))

#print("Entries recorded: " + count)

for i in range(0, len(x)):
    if i != 0:
        # calculate square distance
        xdata.append(math.ceil((( x[i] - x[i-1])**2 ) + (( y[i] - y[i-1] )**2))**0.5)

n, bins, patches = plt.hist(x=xdata, bins='auto', color='#0504aa', alpha=0.7, rwidth=0.85)

plt.grid(axis='y', alpha=0.75)
plt.xlabel('Distance Between Two Eye Movements (TicTacToe)')
plt.ylabel('Frequency')
plt.title('Histogram of Results')
maxfreq = max(n)

plt.ylim(ymax = np.ceil(maxfreq / 10) * 10 if maxfreq % 10 else maxfreq + 10)
plt.xlim(left=-10)
plt.xlim(right=1000)
plt.xticks(np.arange(0, 1000, step=100))
plt.show()
print(maxfreq)