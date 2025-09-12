"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  Home, 
  Token, 
  Vote, 
  Wallet, 
  BarChart3, 
  Settings, 
  FileText,
  Staking,
  NFT
} from 'lucide-react';

const navigation = [
  { name: '首页', href: '/', icon: Home },
  { name: '代币管理', href: '/tokens', icon: Token },
  { name: 'NFT管理', href: '/nfts', icon: NFT },
  { name: '质押系统', href: '/staking', icon: Staking },
  { name: '治理中心', href: '/governance', icon: Vote },
  { name: '多签钱包', href: '/multisig', icon: Wallet },
  { name: '数据分析', href: '/analytics', icon: BarChart3 },
  { name: '文档', href: '/docs', icon: FileText },
  { name: '设置', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r">
      <div className="flex h-16 items-center px-6 border-b">
        <h1 className="text-xl font-bold text-gray-900">RWA Platform</h1>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                isActive
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}